"use client";

import React, { useState, useEffect, use } from "react";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { MockInterview } from "@/utils/schema";
import QuestionsSection from "./_components/QuestionsSection";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const RecordAnswerSection = dynamic(
  () => import("./_components/RecordAnswerSection"),
  { ssr: false }
);

function StartInterview({ params }) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;

  const router = useRouter();
  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingEnd, setPendingEnd] = useState(false);
  const [isLastMinute, setIsLastMinute] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [questionBuffer, setQuestionBuffer] = useState([]);

  const INTERVIEW_DURATION = 60 * 10;

  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window === "undefined") return INTERVIEW_DURATION;
    const savedStart = localStorage.getItem("interviewStartTime");
    if (savedStart) {
      const startTime = parseInt(savedStart);
      const now = Date.now();
      if (now - startTime > INTERVIEW_DURATION * 1000) {
        localStorage.setItem("interviewStartTime", now);
        return INTERVIEW_DURATION;
      }
      const elapsed = Math.floor((now - startTime) / 1000);
      return Math.max(INTERVIEW_DURATION - elapsed, 0);
    } else {
      localStorage.setItem("interviewStartTime", Date.now());
      return INTERVIEW_DURATION;
    }
  });

  const [timeUp, setTimeUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { checkMediaPermissions(); }, []);
  useEffect(() => { if (interviewId) GetInterviewDetails(); }, [interviewId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 60) setIsLastMinute(true);
        if (prev <= 1) { clearInterval(timer); setTimeUp(true); setPendingEnd(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pendingEnd && interviewData?.mockId && !isProcessing && !isRecording) {
      localStorage.removeItem("interviewStartTime");
      alert("Time is up! Interview ended.");
      window.location.href = `/dashboard/interview/${interviewData?.mockId}/feedback`;
    }
  }, [timeUp, interviewData, isProcessing]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  };

  useEffect(() => {
    const handleClick = () => { enterFullscreen(); document.removeEventListener("click", handleClick); };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handleExit = () => {
      if (!document.fullscreenElement && !timeUp)
        alert("Please stay in fullscreen mode during the interview.");
    };
    document.addEventListener("fullscreenchange", handleExit);
    return () => document.removeEventListener("fullscreenchange", handleExit);
  }, [timeUp]);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaReady(true);
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      alert("Camera and Microphone must be enabled to start the interview.");
      setMediaReady(false);
    }
  };

  const GetInterviewDetails = async () => {
    const result = await db.select().from(MockInterview).where(eq(MockInterview.mockId, interviewId));
    if (result.length > 0) {
      const jsonMockResp = JSON.parse(result[0].jsonMockResp);

      const q = Array.isArray(jsonMockResp.questions)
        ? jsonMockResp.questions
        : jsonMockResp.question
          ? [jsonMockResp]
          : [];

      setMockInterviewQuestion(q);
      setQuestions(q);
      setQuestionBuffer(q);
      setInterviewData(result[0]);
    }
  };
  const generateNextBatch = async () => {
    try {
      const history = questionBuffer
        .slice(0, activeQuestionIndex)
        .map(q => ({
          question: q.question,
          answer: q.answer || ""
        }));

      const res = await fetch("/api/next-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history,
          role: interviewData?.jobPosition
        })
      });

      const data = await res.json();

      if (data?.questions) {
        setQuestionBuffer(prev => [...prev, ...data.questions]);
      }

    } catch (err) {
      console.error("Batch generation failed", err);
    }
  };
  const handleEndInterview = () => {
    localStorage.removeItem("interviewStartTime");
    if (document.fullscreenElement) document.exitFullscreen();
    router.push(`/dashboard/interview/${interviewData?.mockId}/feedback`);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isWarning = timeLeft <= 60;

  if (!mediaReady) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="bg-background border border-border rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Camera access required</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please enable your camera and microphone in browser settings to start the interview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
              Mock interview
            </p>
            <p className="text-[15px] font-medium text-foreground leading-none">
              {interviewData?.jobPosition ?? "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-2 bg-background border rounded-full px-3.5 py-1.5 ${isWarning ? "border-red-300" : "border-border"}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isWarning ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
            <span className={`text-[13px] font-medium tabular-nums ${isWarning ? "text-red-500" : "text-foreground"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button
            onClick={handleEndInterview}
            className="h-8 px-4 text-xs font-medium rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
          >
            End interview
          </button>
        </div>
      </div>

      {/* Warning banner */}
      {isLastMinute && (
        <div className="mb-4 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Under a minute remaining — please wrap up your current answer.
          </p>
        </div>
      )}

      {/* Progress bar */}
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-5">
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuestionsSection
          mockInterviewQuestion={questionBuffer}
          activeQuestionIndex={activeQuestionIndex}
          setActiveQuestionIndex={setActiveQuestionIndex}
        />
        <RecordAnswerSection
          mockInterviewQuestion={questionBuffer}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData}
          setActiveQuestionIndex={setActiveQuestionIndex}
          setQuestions={setQuestions}
          timeUp={timeUp}
          setIsProcessing={setIsProcessing}
          setIsRecording={setIsRecording}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Question {activeQuestionIndex + 1} of {questions?.length || "—"}
        </p>
        {!isLastMinute && activeQuestionIndex !== questionBuffer?.length - 1 && (
          <button
            disabled={isProcessing}
            onClick={async () => {
              const nextIndex = activeQuestionIndex + 1;
              if (nextIndex < questions.length) {
                setActiveQuestionIndex(nextIndex);

                const remaining = questionBuffer.length - nextIndex;

                if (remaining <= 2) {
                  generateNextBatch();
                }
              } else {
                try {
                  const res = await db
                    .select()
                    .from(MockInterview)
                    .where(eq(MockInterview.mockId, interviewData.mockId));
                  const json = JSON.parse(res[0].jsonMockResp);
                  setQuestions(json.questions || []);
                  setActiveQuestionIndex(nextIndex);
                } catch (err) {
                  console.error("Fetch failed:", err);
                }
              }
            }}
            className="h-9 px-5 text-sm font-medium rounded-full bg-foreground text-background transition-opacity flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 disabled:hover:opacity-30"
          >
            Next question
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
}

export default StartInterview;