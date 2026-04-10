import React from "react";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/interviewList";

function Dashboard() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');

        .dash-root {
          min-height: 100vh;
          background: #f9f9fb;
          background-image: radial-gradient(ellipse 80% 40% at 50% -5%, rgba(99,102,241,0.07) 0%, transparent 60%);
          padding: 40px 32px 64px;
          box-sizing: border-box;
          font-family: 'Syne', sans-serif;
        }
        @media (max-width: 640px) {
          .dash-root { padding: 24px 16px 48px; }
        }
        .dash-header {
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid #e4e4e7;
        }
        .dash-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 8px;
        }
        .dash-title {
          font-weight: 800;
          font-size: clamp(26px, 4vw, 36px);
          color: #18181b;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .dash-subtitle {
          font-size: 14px;
          color: #71717a;
          margin-top: 8px;
          line-height: 1.5;
        }
        .dash-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .dash-section-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a1a1aa;
          white-space: nowrap;
        }
        .dash-section-line {
          flex: 1;
          height: 1px;
          background: #e4e4e7;
        }
        .dash-new-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 52px;
        }
      `}</style>

      <div className="dash-root">
        <div className="dash-header">
          <p className="dash-eyebrow">AI Mock Interviews</p>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '2.4rem',
              color: '#000'
            }}
          >
            Your Dashboard
          </h1>
          <p className="dash-subtitle">
            Prepare smarter. Practice with AI-generated questions tailored to your role.
          </p>
        </div>

        <div style={{ marginBottom: "52px" }}>
          <div className="dash-section-header">
            <span className="dash-section-label">Create new</span>
            <div className="dash-section-line" />
          </div>
          <div className="dash-new-grid">
            <AddNewInterview />
          </div>
        </div>

        <div>
          <div className="dash-section-header">
            <span className="dash-section-label">Previous sessions</span>
            <div className="dash-section-line" />
          </div>
          <InterviewList />
        </div>
      </div>
    </>
  );
}

export default Dashboard;