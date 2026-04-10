"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Calendar, Briefcase } from "lucide-react";

function InterviewItemCard({ interview }) {
  const router = useRouter();

  const onStartInterview = () => router.push("/dashboard/interview/" + interview?.mockId);
  const onFeedbackPress = () => router.push("/dashboard/interview/" + interview?.mockId + "/feedback");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap');

        .iic-card {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid #e4e4e7;
          background: #ffffff;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .iic-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .iic-card:hover {
          border-color: #c7d2fe;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.1);
        }
        .iic-card:hover::before { opacity: 1; }
        .iic-card:hover .iic-role { color: #4f46e5; }

        .iic-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .iic-meta-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #a1a1aa;
          letter-spacing: 0.05em;
        }
        .iic-role {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: #18181b;
          margin-bottom: 16px;
          line-height: 1.3;
          transition: color 0.2s ease;
        }
        .iic-divider {
          height: 1px;
          background: #f4f4f5;
          margin: 14px 0;
        }
        .iic-actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }
        .iic-btn-primary {
          font-family: 'Syne', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          height: 36px;
          padding: 0 16px;
          border-radius: 8px;
          border: none;
          background: #6366f1;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 8px rgba(99,102,241,0.25);
        }
        .iic-btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }
        .iic-btn-primary svg { transition: transform 0.2s ease; }
        .iic-btn-primary:hover svg { transform: translateX(2px); }
        .iic-btn-ghost {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 500;
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #e4e4e7;
          background: transparent;
          color: #71717a;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
          white-space: nowrap;
        }
        .iic-btn-ghost:hover {
          border-color: #a1a1aa;
          color: #3f3f46;
          background: #f4f4f5;
        }
        .iic-exp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px 3px 7px;
          border-radius: 100px;
          background: #ede9fe;
          border: 1px solid #ddd6fe;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #6366f1;
          letter-spacing: 0.06em;
        }
      `}</style>

      <div className="iic-card">
        <div className="iic-meta-row">
          <span className="iic-exp-badge">
            <Briefcase size={9} />
            {interview?.jobExperience} yrs
          </span>
          <span className="iic-meta-chip">
            <Calendar size={10} />
            {interview?.createdAt}
          </span>
        </div>

        <h3 className="iic-role">{interview?.jobPosition}</h3>

        <div className="iic-divider" />

        <div className="iic-actions">
          <button className="iic-btn-primary" onClick={onStartInterview}>
            Start interview
            <ArrowRight size={13} />
          </button>
          <button className="iic-btn-ghost" onClick={onFeedbackPress}>
            <MessageSquare size={11} />
            Feedback
          </button>
        </div>
      </div>
    </>
  );
}

export default InterviewItemCard;