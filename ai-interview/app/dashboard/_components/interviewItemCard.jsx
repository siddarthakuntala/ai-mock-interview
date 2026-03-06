"use client"

import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from "@/components/ui/button";

function interviewItemCard({ interview }) {

  const router = useRouter();

  const onStartInterview = () => {
    router.push('/dashboard/interview/' + interview?.mockId)
  }

  const onFeedbackPress = () => {
    router.push('/dashboard/interview/' + interview?.mockId + '/feedback')
  }

  return (
    <div className="border shadow-md rounded-xl p-5 min-h-40 flex flex-col justify-between hover:shadow-lg transition">

      <div>
        <h2 className="font-bold text-lg text-primary">
          {interview?.jobPosition}
        </h2>

        <h2 className="text-sm text-gray-600 mt-1">
          {interview?.jobExperience} Years Experience
        </h2>

        <h2 className="text-xs text-gray-400 mt-2">
          Created At: {interview?.createdAt}
        </h2>
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" className="flex-1" onClick={onStartInterview}>
          Start
        </Button>

        <Button size="sm" variant="outline" className="flex-1" onClick={onFeedbackPress}>
          Feedback
        </Button>
      </div>

    </div>
  )
}

export default interviewItemCard