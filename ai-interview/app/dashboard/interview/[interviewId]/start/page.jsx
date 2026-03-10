"use client";

import React, { useState, useEffect, use } from "react";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { MockInterview } from "@/utils/schema";
import QuestionsSection from "./_components/QuestionsSection";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const RecordAnswerSection = dynamic(
  () => import("./_components/RecordAnswerSection"),
  { ssr: false }
);

function StartInterview({ params }) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;

  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    checkMediaPermissions();
  }, []);

  useEffect(() => {
    if (interviewId) {
      GetInterviewDetails();
    }
  }, [interviewId]);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setMediaReady(true);

      // stop camera after permission check
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      alert("Camera and Microphone must be enabled to start the interview.");
      setMediaReady(false);
    }
  };

  const GetInterviewDetails = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId));

    if (result.length > 0) {
      const jsonMockResp = JSON.parse(result[0].jsonMockResp);
      setMockInterviewQuestion(jsonMockResp.questions);
      setInterviewData(result[0]);
    }
  };

  if (!mediaReady) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Please enable camera and microphone to start the interview.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <QuestionsSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
        />

        <RecordAnswerSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData}
        />
      </div>

      <div className="flex justify-end gap-6">
        {activeQuestionIndex != mockInterviewQuestion?.length - 1 && (
          <Button onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}>
            Next Question
          </Button>
        )}

        {activeQuestionIndex == mockInterviewQuestion?.length - 1 && (
          <Link href={`/dashboard/interview/${interviewData?.mockId}/feedback`}>
            <Button>End Interview</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default StartInterview;