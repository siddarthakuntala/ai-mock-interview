"use client";
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
import AudioVisualizer from '@/components/ui/AudioVisualizer';

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData, setIsProcessing }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null); // ✅ added
  const { user } = useUser();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream); // ✅ fixed
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = handleStop;

    mediaRecorder.start();
    setIsRecording(true);
    setIsProcessing(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      setIsProcessing(true);

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", audioBlob);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Transcript Response:", data);

      if (!data?.text || data.text.length < 10) {
        setLoading(false);
        toast('Error while saving your Answer, Please record again');
        return;
      }

      setUserAnswer(data.text);

      const feedbackPrompt = `
You are an AI interviewer.

Return ONLY valid JSON. No explanation. No text outside JSON.

Format:
{
  "rating": "7/10",
  "feedback": "short feedback",
  "communicationScore": "6/10",
  "confidenceScore": "8/10"
}

Question: ${mockInterviewQuestion?.[activeQuestionIndex]?.question}
Answer: ${data.text}
`;

      const result = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: feedbackPrompt }),
      });

      const feedbackData = await result.json();
      console.log("Gemini RAW Response:", feedbackData);

      if (feedbackData.text) {
        const cleanText = feedbackData.text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        let parsed;

        try {
          parsed = JSON.parse(cleanText);
        } catch (err) {
          console.error("JSON parse failed:", feedbackData.text);
        }

        console.log("Parsed Feedback:", parsed);

        const saveResponse = await fetch("/api/save-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mockIdRef: interviewData?.mockId,
            question: mockInterviewQuestion?.[activeQuestionIndex]?.question,
            userAns: data.text,
            feedback: parsed?.feedback,
            rating: parsed?.rating,
            communicationScore: parsed?.communicationScore,
            confidenceScore: parsed?.confidenceScore,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            createdAt: moment().format('DD-MM-yyyy')
          }),
        });

        const saveData = await saveResponse.json();

        if (saveData?.success) {
          toast('User answer recorded successfully');
        } else {
          toast('Failed to save user answer');
        }
      }

      setUserAnswer('');
      setLoading(false);
      setIsProcessing(false);

    } catch (error) {
      setLoading(false);
      setIsProcessing(false);
      console.error("Transcription failed:", error);
    }
  };

  return (
    <div className='flex items-center justify-center flex-col'>
      <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5 relative'>
        <img src="/cam.webp" width={200} height={200} className="absolute" />
        <Webcam
          mirrored
          style={{ height: 300, width: '100%', zIndex: 10 }}
        />
        {isRecording && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-[11px] font-medium tracking-wide">REC</span>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="w-full max-w-sm mt-4 px-2">
          <AudioVisualizer stream={stream} isRecording={isRecording} />
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground min-h-[16px]">
        {isRecording
          ? "Recording your answer..."
          : loading
            ? "Processing, please wait..."
            : ""}
      </p>

      <Button
        disabled={loading}
        variant='outline'
        className={`my-4 transition-all ${isRecording ? "border-red-400 text-red-600 hover:bg-red-50" : loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? (
          <span className='text-red-600 flex items-center gap-2'>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <Mic className="w-4 h-4" /> Stop Recording
          </span>
        ) : loading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Mic className="w-4 h-4" /> Record Answer
          </span>
        )}
      </Button>
      <p>{userAnswer}</p>
    </div>
  );
}

export default RecordAnswerSection;