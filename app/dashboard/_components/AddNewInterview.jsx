"use client";

import React, { useState } from "react";
import { db } from "@/utils/db";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const extractPDFText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + " ";
    }
    return text.replace(/\s+/g, " ").trim();
  };

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      alert("Camera and microphone access is required to start the interview.");
      return false;
    }
  };

  const handleFileChange = (file) => {
    if (file && (file.type === "application/pdf" || file.name.endsWith(".doc") || file.name.endsWith(".docx"))) {
      setResume(file);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const allowed = await checkMediaPermissions();
    if (!allowed) return;

    setLoading(true);
    let resumeText = "";
    if (resume?.type === "application/pdf") {
      resumeText = await extractPDFText(resume);
    }

    const inputPrompt = `
You are a senior technical interviewer with real-world industry experience.

Input:
- Job Description (JD): ${jobDesc}
- Role: ${jobPosition}
- Candidate Experience: ${jobExperience}
- Candidate Resume: ${resumeText}

Task:
Generate exactly TWO high-quality interview questions with answers.

Instructions for Question Style:
- Ask direct, natural interview questions (like a real interviewer speaking).
- Do NOT include phrases like "based on the JD", "according to the resume", etc.
- Questions must be clear, specific, and technically deep.
- Avoid generic or textbook questions.
- Prefer scenario-based, problem-solving, or concept-application questions.
- Match difficulty to the candidate's experience level.

Instructions for Answers:
- Answers must be concise but technically correct.
- Include key concepts, not long explanations.

Strict Output Rules:
1. Output MUST be valid JSON.
2. Do NOT include markdown, explanations, comments, or extra text.
3. Do NOT wrap output in code fences.
4. All keys and string values MUST use double quotes.
5. No trailing commas.
6. Return exactly 2 items in the questions array.

Output Format:
{
  "questions": [
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" }
  ]
}
`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      const data = await res.json();
      if (!data?.text) { setLoading(false); return; }

      const cleanText = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanText);

      if (parsed) {
        const resp = await db
          .insert(MockInterview)
          .values({
            mockId: uuidv4(),
            jsonMockResp: parsed,
            jobPosition,
            jobDesc,
            jobExperience,
            createdBy: user?.primaryEmailAddress?.emailAddress,
            createdAt: moment().format("DD-MM-YYYY"),
          })
          .returning({ mockId: MockInterview.mockId });

        if (resp) {
          setOpenDialog(false);
          router.push("/dashboard/interview/" + resp[0]?.mockId);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setOpenDialog(false);
    setJobPosition("");
    setJobDesc("");
    setJobExperience("");
    setResume(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .ani-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          border-radius: 14px;
          border: 1px solid #e4e4e7;
          background: #ffffff;
          padding: 28px;
          transition: border-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .ani-card:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.1), 0 2px 8px rgba(0,0,0,0.06);
        }
        .ani-card:hover .plus-icon {
          transform: rotate(90deg);
          color: #6366f1;
        }
        .plus-icon {
          transition: transform 0.3s ease, color 0.25s ease;
          color: #a1a1aa;
        }
        .ani-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #71717a;
          margin-bottom: 6px;
          display: block;
        }
        .ani-input {
          font-family: 'Syne', sans-serif;
          font-size: 13.5px;
          width: 100%;
          height: 42px;
          padding: 0 14px;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          color: #18181b;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
        }
        .ani-input::placeholder { color: #a1a1aa; }
        .ani-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .ani-file-zone {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 42px;
          padding: 0 14px;
          background: #fafafa;
          border: 1px dashed #d4d4d8;
          border-radius: 8px;
          color: #a1a1aa;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
          overflow: hidden;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
        }
        .ani-file-zone:hover, .ani-file-zone.drag-over {
          border-color: #6366f1;
          background: #f5f3ff;
          color: #6366f1;
        }
        .ani-file-zone.has-file {
          border-style: solid;
          border-color: #6366f1;
          color: #6366f1;
          background: #f5f3ff;
        }
        .ani-btn-cancel {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 500;
          height: 40px;
          padding: 0 18px;
          border-radius: 8px;
          border: 1px solid #e4e4e7;
          background: transparent;
          color: #71717a;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .ani-btn-cancel:hover {
          border-color: #a1a1aa;
          color: #3f3f46;
          background: #f4f4f5;
        }
        .ani-btn-submit {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          height: 40px;
          padding: 0 22px;
          border-radius: 8px;
          border: none;
          background: #6366f1;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 8px rgba(99,102,241,0.25);
        }
        .ani-btn-submit:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(99,102,241,0.35);
        }
        .ani-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .step-pill {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 100px;
          background: #ede9fe;
          color: #6366f1;
          border: 1px solid #ddd6fe;
        }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .form-divider { height: 1px; background: #f4f4f5; margin: 20px 0; }
      `}</style>

      <div className="ani-card" onClick={() => setOpenDialog(true)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa" }}>
            New session
          </span>
          <Plus size={20} className="plus-icon" />
        </div>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px", color: "#18181b", marginBottom: "4px" }}>
            Start interview
          </p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "12.5px", color: "#a1a1aa", lineHeight: 1.5 }}>
            AI-powered mock sessions tailored to your role
          </p>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent
          style={{
            fontFamily: "'Syne', sans-serif",
            background: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            maxWidth: "480px",
            padding: "28px",
          }}
        >
          <DialogHeader>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <span className="step-pill">New interview</span>
              {/* ❌ Removed extra X button here */}
            </div>

            <DialogTitle
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                color: "#18181b",
                marginBottom: "2px",
              }}
            >
              Interview details
            </DialogTitle>

            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "13px",
                color: "#71717a",
                margin: 0,
              }}
            >
              We'll generate 5 tailored questions based on your role and resume.
            </p>
          </DialogHeader>

          <form onSubmit={onSubmit} style={{ marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div className="field-group">
                <label className="ani-label">Job role</label>
                <input
                  className="ani-input"
                  placeholder="e.g. Senior Frontend Engineer"
                  required
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="ani-label">Tech stack / Description</label>
                <input
                  className="ani-input"
                  placeholder="e.g. React, TypeScript, Node.js, GraphQL"
                  required
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="field-group">
                  <label className="ani-label">Years of exp.</label>
                  <input
                    className="ani-input"
                    placeholder="e.g. 3"
                    type="number"
                    min={0}
                    max={50}
                    required
                    value={jobExperience}
                    onChange={(e) => setJobExperience(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="ani-label">Resume (PDF)</label>
                  <label
                    className={`ani-file-zone ${dragOver ? "drag-over" : ""
                      } ${resume ? "has-file" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFileChange(e.dataTransfer.files[0]);
                    }}
                  >
                    <Upload size={13} style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "12.5px",
                      }}
                    >
                      {resume?.name ?? "Upload PDF"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      required
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="form-divider" />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="ani-btn-cancel"
                onClick={resetAndClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ani-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={13}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Generating...
                  </>
                ) : (
                  "Generate questions"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddNewInterview;