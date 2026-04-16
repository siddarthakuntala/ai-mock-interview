"use client";
import React, { useEffect, useState } from "react";

function QuestionsSection({ mockInterviewQuestion, activeQuestionIndex, setActiveQuestionIndex }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, []);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeQuestionIndex]);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-5 h-full">

      {/* ✅ Only current question number */}
      <div className="text-sm font-medium text-muted-foreground">
        Question {activeQuestionIndex + 1}
      </div>

      <div className="border-t border-border" />

      <div className="flex-1">
        <p className="text-[15px] leading-[1.75] text-foreground">
          {mockInterviewQuestion?.[activeQuestionIndex]?.question}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => speak(mockInterviewQuestion?.[activeQuestionIndex]?.question)}
          className={`flex items-center gap-1.5 h-7 px-3 text-xs rounded-lg border transition-colors ${
            isSpeaking
              ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted"
          }`}
        >
          {isSpeaking ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              Read aloud
            </>
          )}
        </button>

        <span className="text-[11px] text-muted-foreground">
          {isSpeaking ? "Reading question..." : "Take your time"}
        </span>
      </div>
    </div>
  );
}

export default QuestionsSection;