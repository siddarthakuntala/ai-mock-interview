"use client";
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = handleStop;

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleStop = async () => {
    try {
      setLoading(true);

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

      const feedbackPrompt =
        "Question: " +
        mockInterviewQuestion?.[activeQuestionIndex]?.question +
        ", User Answer: " +
        data.text +
        " Please give rating and feedback in JSON format with rating and feedback fields.";

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

        const parsed = JSON.parse(cleanText);
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

    } catch (error) {
      setLoading(false);
      console.error("Transcription failed:", error);
    }
  };

  return (
    <div className='flex items-center justify-center flex-col'>
      <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5 relative'>
        <img src="/cam.webp" width={200} height={200} className="absolute" />
        <Webcam
          mirrored
          style={{
            height: 300,
            width: '100%',
            zIndex: 10
          }}
        />
      </div>

      <Button
        disabled={loading}
        variant='outline'
        className='my-10'
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ?
          <span className='text-red-600 flex gap-2'>
            <Mic /> Stop Recording
          </span>
          :
          loading ? "Processing..." : "Record Answer"}
      </Button>

      <h2>Transcript:</h2>
      <p>{userAnswer}</p>
    </div>
  );
}

export default RecordAnswerSection;