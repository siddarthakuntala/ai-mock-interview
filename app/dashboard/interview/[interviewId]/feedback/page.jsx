"use client";

import React, { useEffect, useState, use } from "react";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { ChevronsUpDown, ChevronUp, Home, Trophy, MessageSquare, Star, Volume2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// ✅ ADDED: Normalize rating
const normalizeRating = (rating) => {
  if (rating === null || rating === undefined) return 0;
  return Number(String(rating).split("/")[0]) || 0;
};

// ✅ ADDED: Normalize score
const normalizeScore = (score) => {
  if (score === null || score === undefined) return 0;
  return Number(String(score).split("/")[0]) || 0;
};

function Feedback({ params }) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;

  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (interviewId) GetFeedback();
  }, [interviewId]);

  const GetFeedback = async () => {
    try {
      const result = await db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.mockIdRef, interviewId))
        .orderBy(UserAnswer.id);
      setFeedbackList(result);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (feedbackList.length === 0) return 0;
    const total = feedbackList.reduce(
      (sum, item) => sum + normalizeRating(item.rating), // ✅ FIXED
      0
    );
    return (total / feedbackList.length).toFixed(1);
  };

  const getPerformanceLabel = (avg) => {
    if (avg >= 8.5) return { label: "Excellent", color: "text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400" };
    if (avg >= 7)   return { label: "Good",      color: "text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400" };
    if (avg >= 5)   return { label: "Average",   color: "text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400" };
    return           { label: "Needs work",  color: "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400" };
  };

  const getRatingColor = (rating) => {
    const r = normalizeRating(rating); // ✅ FIXED
    if (r >= 8) return "text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400";
    if (r >= 5) return "text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400";
    return "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400";
  };

  const avg = parseFloat(calculateAverageRating());
  const performance = getPerformanceLabel(avg);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="bg-background border border-border rounded-2xl p-10 max-w-sm w-full text-center">
          <p className="text-sm font-medium text-foreground mb-1">Something went wrong</p>
          <p className="text-xs text-muted-foreground mb-5">We couldn't load your feedback. Please try again.</p>
          <button
            onClick={() => { setError(false); setLoading(true); GetFeedback(); }}
            className="h-8 px-4 text-xs font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="bg-background border border-border rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No feedback yet</p>
          <p className="text-xs text-muted-foreground mb-5">
            It looks like no answers were recorded for this session.
          </p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="h-8 px-4 text-xs font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-5 md:p-8">

      <div className="mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
          Interview complete
        </p>
        <h1 className="text-xl font-medium text-foreground mb-0.5">Congratulations!</h1>
        <p className="text-sm text-muted-foreground">Here's your detailed interview feedback</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground mb-1">Overall rating</p>
          <p className="text-2xl font-medium text-foreground leading-none">
            {calculateAverageRating()}
            <span className="text-sm text-muted-foreground font-normal">/10</span>
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground mb-1">Questions answered</p>
          <p className="text-2xl font-medium text-foreground leading-none">
            {feedbackList.length}
            <span className="text-sm text-muted-foreground font-normal"> total</span>
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground mb-1">Performance</p>
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${performance.color}`}>
            {performance.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {feedbackList.map((item, index) => {
          const isOpen = openIndex === index;
          const ratingValue = normalizeRating(item.rating); // ✅ FIXED

          return (
            <div key={index} className="bg-background border border-border rounded-xl overflow-hidden">

              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                <span className="text-[11px] font-medium bg-muted border border-border rounded-full px-2.5 py-0.5 text-muted-foreground shrink-0">
                  Q{index + 1}
                </span>

                <p className="flex-1 text-[13px] text-foreground leading-snug line-clamp-1">
                  {item.question}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${getRatingColor(ratingValue)}`}>
                    {ratingValue}/10 {/* ✅ FIXED */}
                  </span>

                  {isOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    : <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-3">

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Question</p>
                    <p className="text-[13px] text-foreground leading-relaxed">{item.question}</p>
                  </div>

                  {item.userAns && (
                    <div className="bg-muted/40 border border-border rounded-lg p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Your answer</p>
                      <p className="text-[13px] text-foreground leading-relaxed">{item.userAns}</p>
                    </div>
                  )}

                  {item.feedback && (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3.5 dark:bg-green-950/20 dark:border-green-900">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-green-700 dark:text-green-400 mb-1.5">Feedback</p>
                      <p className="text-[13px] text-green-900 dark:text-green-300 leading-relaxed">{item.feedback}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Overall Score</p>
                      <p className="text-[11px] text-muted-foreground">{ratingValue}/10</p>
                    </div>

                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ratingValue >= 8 ? "bg-green-500" :
                          ratingValue >= 5 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${(ratingValue / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {item.communicationScore && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1 flex items-center justify-between">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Communication Score</p>
                          <p className="text-[11px] text-muted-foreground">{normalizeScore(item.communicationScore)}/10</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-blue-500"
                          style={{ width: `${(normalizeScore(item.communicationScore) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.confidenceScore && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <div className="flex-1 flex items-center justify-between">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Confidence Score</p>
                          <p className="text-[11px] text-muted-foreground">{normalizeScore(item.confidenceScore)}/10</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-purple-500"
                          style={{ width: `${(normalizeScore(item.confidenceScore) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {feedbackList.length} question{feedbackList.length !== 1 ? "s" : ""} reviewed
        </p>
        <button
          onClick={() => router.replace("/dashboard")}
          className="h-9 px-5 text-[13px] font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Home className="w-3.5 h-3.5" />
          Go home
        </button>
      </div>

    </div>
  );
}

export default Feedback;