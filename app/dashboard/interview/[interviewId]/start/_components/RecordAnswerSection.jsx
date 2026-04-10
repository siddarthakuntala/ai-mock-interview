"use client";
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
import AudioVisualizer from "@/components/ui/AudioVisualizer";

const MAX_RECORDING_SECONDS = 120;
const MIN_RECORDING_SECONDS = 2;

function RecordAnswerSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
  setActiveQuestionIndex,
  setQuestions,
  timeUp,
  setIsProcessing,
  setIsRecording,
}) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecordingLocal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recordingError, setRecordingError] = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [stream, setStream] = useState(null);
  const [answerSaved, setAnswerSaved] = useState(false); // ✅ new
  const { user } = useUser();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Reset saved state when question changes
  useEffect(() => {
    setAnswerSaved(false);
    setUserAnswer('');
    setRecordingError(null);
  }, [activeQuestionIndex]);

  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      clearTimeout(maxTimerRef.current);
      stream?.getTracks().forEach(t => t.stop());
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stream]);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => {
    if (timeUp && isRecordingRef.current) stopRecording();
  }, [timeUp]);

  const startTimer = () => {
    setRecordSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(recordingTimerRef.current);
    clearTimeout(maxTimerRef.current);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    if (loading || isRecording || isProcessingRef.current) return;
    setRecordingError(null);
    setAnswerSaved(false);

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);

      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = handleStop;
      mediaRecorder.start(250);

      setIsRecordingLocal(true);
      if (setIsRecording) setIsRecording(true);
      startTimer();

      maxTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          toast("Maximum recording time reached");
          stopRecording();
        }
      }, MAX_RECORDING_SECONDS * 1000);

    } catch (err) {
      console.error("Microphone access error:", err);
      setRecordingError("Microphone access denied. Check browser permissions.");
    }
  };

  const stopRecording = useCallback(() => {
    stopTimer();
    stream?.getAudioTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingLocal(false);
    if (setIsRecording) setIsRecording(false);
  }, [stream, setIsRecording]);

  const handleStop = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (recordSeconds < MIN_RECORDING_SECONDS && audioChunksRef.current.length < 3) {
      toast.error("Recording too short. Please try again.");
      isProcessingRef.current = false;
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Transcribing your answer...');
      if (setIsProcessing) setIsProcessing(true);

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      if (audioBlob.size < 1000) {
        toast.error("No audio detected. Please try again.");
        setLoading(false);
        if (setIsProcessing) setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      const formData = new FormData();
      formData.append("file", audioBlob, "answer.webm");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) throw new Error(`Transcription HTTP ${transcribeRes.status}`);

      const transcribeData = await transcribeRes.json();

      if (!transcribeData?.text || transcribeData.text.trim().length < 10) {
        toast.error("Couldn't understand the audio. Please record again.");
        setLoading(false);
        if (setIsProcessing) setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      const transcribedText = transcribeData.text.trim();
      const currentQuestion = mockInterviewQuestion?.[activeQuestionIndex]?.question;

      setUserAnswer(transcribedText);
      setLoadingMessage('Analyzing & generating next question...');

      const feedbackPrompt =
        "Interview Question: " + currentQuestion +
        "\nUser Answer: " + transcribedText +
        "\n\nEvaluate the user's answer like an interview evaluator." +
        "\nGive the response strictly in JSON format with the following fields:" +
        "\n- rating: score for this answer out of 10" +
        "\n- feedback: short constructive feedback (2-3 sentences)" +
        "\n- improvement: what the candidate could improve in the answer" +
        "\n- overall_rating: overall interview performance score out of 10" +
        "\nReturn only JSON.";

      const [feedbackResult, nextQResult] = await Promise.allSettled([
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: feedbackPrompt }),
        }).then(r => r.json()),

        fetch("/api/next-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: transcribedText,
            question: currentQuestion,
            interviewId: interviewData?.mockId,
          }),
        }).then(r => r.json()),
      ]);

      const feedbackData = feedbackResult.status === 'fulfilled' ? feedbackResult.value : null;

      // Build save payload — always save the answer even if feedback failed
      const savePayload = {
        mockIdRef: interviewData?.mockId,
        question: currentQuestion,
        userAns: transcribedText,
        feedback: "",
        rating: 0,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-yyyy"),
      };

      if (feedbackData?.text) {
        try {
          const cleanText = feedbackData.text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanText);
          savePayload.feedback = parsed?.feedback ?? "";
          savePayload.rating = parsed?.rating ?? 0;
        } catch (parseErr) {
          console.error("Feedback parse error:", parseErr);
        }
      }

      // Save answer — await this so we can confirm it saved
      setLoadingMessage('Saving your answer...');
      try {
        const saveRes = await fetch("/api/save-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savePayload),
        });

        if (saveRes.ok) {
          setAnswerSaved(true); // ✅ show success state
        } else {
          setRecordingError("Answer may not have saved. Continue anyway.");
        }
      } catch (saveErr) {
        console.error("Save answer error:", saveErr);
        setRecordingError("Answer may not have saved. Continue anyway.");
      }

      // Advance to next question
      const nextQData = nextQResult.status === 'fulfilled' ? nextQResult.value : null;
      // ✅ SAVE next question into DB (update jsonMockResp)
      if (nextQData?.next_question) {
        try {
          const existing = JSON.parse(interviewData.jsonMockResp);

          const updatedQuestions = [
            ...(existing.questions || []),
            { question: nextQData.next_question }
          ];

          await fetch("/api/update-questions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              mockId: interviewData.mockId,
              questions: updatedQuestions
            })
          });

        } catch (err) {
          console.error("Failed to update questions:", err);
        }
      }

      if (!nextQData) {
        toast.error("Couldn't generate next question. Try refreshing.");
      } else if (nextQData?.end) {
        toast("Interview completed!");
      } else if (nextQData?.next_question) {
        if (setQuestions) setQuestions(prev => [...prev, { question: nextQData.next_question }]);
        if (setActiveQuestionIndex) setActiveQuestionIndex(prev => prev + 1);
      }

      setRecordSeconds(0);

    } catch (error) {
      console.error("Processing failed:", error);
      toast.error("Something went wrong. Please try again.");
      setRecordingError("Processing failed. Your answer may not have been saved.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
      if (setIsProcessing) setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const isWarning = recordSeconds >= MAX_RECORDING_SECONDS - 30;

  return (
    <div className="flex flex-col gap-3">

      {/* Webcam */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-border">
        <Webcam
          mirrored
          audio={false}
          className="w-full aspect-[4/3] object-cover"
        />

        {/* Status pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
          <span className="text-[11px] text-white/70">{isRecording ? 'Recording' : 'Live'}</span>
        </div>

        {/* Recording countdown */}
        {isRecording && (
          <div className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums ${isWarning ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white/70'
            }`}>
            {formatTime(recordSeconds)} / {formatTime(MAX_RECORDING_SECONDS)}
          </div>
        )}

        {/* Processing overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <p className="text-xs text-white/80 font-medium">{loadingMessage}</p>
          </div>
        )}

        {/* ✅ Answer saved overlay — shows briefly on webcam */}
        {answerSaved && !loading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-xs text-green-300 font-medium">Answer saved</p>
          </div>
        )}
      </div>

      {/* Audio visualizer */}
      {isRecording && (
        <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">REC</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <AudioVisualizer stream={stream} isRecording={isRecording} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {formatTime(recordSeconds)}
          </span>
        </div>
      )}

      {/* ✅ Success banner */}
      {answerSaved && !loading && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl dark:bg-green-950/20 dark:border-green-900">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">Answer recorded & saved</p>
            <p className="text-[11px] text-green-600/70 dark:text-green-500 mt-0.5">Your response has been captured. Moving to the next question...</p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {recordingError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl dark:bg-red-950/20 dark:border-red-900">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{recordingError}</p>
        </div>
      )}

      {/* Answer preview */}
      {userAnswer && !loading && (
        <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Your answer</p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">{userAnswer}</p>
        </div>
      )}

      {/* Record button */}
      <button
        disabled={loading || answerSaved}
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
            : answerSaved
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400'
              : 'bg-background border-border text-foreground hover:bg-muted'
          }`}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage}</>
        ) : isRecording ? (
          <><Square className="w-3.5 h-3.5 fill-current" />Stop recording</>
        ) : answerSaved ? (
          <><CheckCircle2 className="w-4 h-4" />Answer saved</>
        ) : (
          <><Mic className="w-3.5 h-3.5" />Record answer</>
        )}
      </button>

    </div>
  );
}

export default RecordAnswerSection;