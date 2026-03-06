"use client";

import React, { useEffect, useState, use } from "react";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function Feedback({ params }) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;

  const [feedbackList, setFeedbackList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (interviewId) {
      GetFeedback();
    }
  }, [interviewId]);

  const GetFeedback = async () => {
    try {
      console.log("InterviewId from URL:", interviewId);

      const result = await db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.mockIdRef, interviewId))
        .orderBy(UserAnswer.id);

      console.log("Feedback Result:", result);

      setFeedbackList(result);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold text-red-700">Congratulation</h2>
      <h2 className="font-bold text-2xl">Here is your interview feedback</h2>

      {feedbackList.length === 0 && (
        <p className="mt-5 text-gray-500">No feedback found.</p>
      )}

      {feedbackList.map((item, index) => (
        <Collapsible key={index} className="mt-7">
          <CollapsibleTrigger
            className="p-2 bg-secondary rounded-lg flex justify-between my-2 text-left gap-7 w-full"
          >
            {item.question}
            <ChevronsUpDown className="h-4 w-4" />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="flex flex-col gap-2">
              <h2 className="text-blue-500 p-2 border rounded-lg">
                <strong>Rating: </strong>
                {item.rating}
              </h2>

              <h2 className="p-2 border rounded-lg text-sm">
                <strong>Your Answer: </strong>
                {item.userAns}
              </h2>

              <h2 className="p-2 border rounded-lg text-sm">
                <strong>Feedback: </strong>
                {item.feedback}
              </h2>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}

      <div className="mt-10">
        <Button onClick={() => router.replace("/dashboard")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}

export default Feedback;