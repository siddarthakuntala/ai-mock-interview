# CHAPTER 10: IMPLEMENTATION

## 10.3 SAMPLE CODE

### 10.3.1 Question Generation — API Endpoint

The question generation module constructs structured prompts for Gemini API based on candidate profile with retry logic and validation.

**File: `app/api/generate/route.js`**

```javascript
// 10.3.1 Question Generation - API Endpoint
// Generates interview questions based on candidate profile using Gemini AI
// Implements Question Generation Module with retry logic and validation

import { generateQuestionsWithRetry } from "@/utils/question-generator";
import { GoogleGenAI } from "@google/genai";

/**
 * POST /api/generate
 * Generates interview questions based on job profile or custom prompt.
 * 
 * Request body options:
 * 1. Prompt-based (for custom prompts):
 *    { "prompt": "string" }
 * 
 * 2. Profile-based (recommended for consistent generation):
 *    {
 *      "jobPosition": "string",
 *      "jobDesc": "string",
 *      "jobExperience": "string",
 *      "noOfQuestions": number
 *    }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "questions": Array<{id, question, difficulty, category, expectedKeywords}>,
 *   "totalQuestions": number
 * }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, jobPosition, jobDesc, jobExperience, noOfQuestions } = body;

    // Validate input
    if (!prompt && (!jobPosition || !jobDesc)) {
      return Response.json(
        { 
          error: "Either 'prompt' or job profile (jobPosition, jobDesc) is required" 
        },
        { status: 400 }
      );
    }

    let result;

    if (prompt) {
      // Direct prompt-based generation
      const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      // Safe text extraction with fallback options
      const text =
        response?.response?.text?.() ||
        response?.text ||
        response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("Gemini returned unexpected response:", response);
        return Response.json(
          { error: "AI returned empty response" },
          { status: 500 }
        );
      }

      return Response.json({ success: true, text });
    } else {
      // Profile-based generation with validation and retry logic
      result = await generateQuestionsWithRetry({
        jobPosition,
        jobDesc,
        jobExperience: jobExperience || "Not specified",
        noOfQuestions: noOfQuestions || 5,
      });

      if (!result.success) {
        return Response.json(
          { success: false, error: result.error || "Failed to generate questions" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        questions: result.questions,
        totalQuestions: result.totalQuestions,
      });
    }
  } catch (error) {
    console.error("🔥 Gemini API Error:", error);
    return Response.json(
      { success: false, error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}
```

**File: `utils/question-generator.js`**

```javascript
// Question Generation Module - Core Logic
// Constructs structured prompts for Gemini API and generates interview questions

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Generates interview questions based on candidate profile
 * @param {Object} profile - Candidate profile containing role, experience, domain
 * @returns {Promise<Array>} Array of question objects
 */
export async function generateQuestions(profile) {
  try {
    if (!profile?.jobPosition || !profile?.jobDesc) {
      throw new Error("Job position and description are required");
    }

    const systemPrompt = buildSystemPrompt(profile);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: systemPrompt,
    });

    const responseText = extractText(response);
    const questionsData = parseQuestionsResponse(responseText);
    
    // Validate questions for relevance and appropriateness
    const validatedQuestions = questionsData.questions.filter(
      (q) => q && q.question && q.question.length > 10
    );

    return {
      success: true,
      questions: validatedQuestions,
      totalQuestions: validatedQuestions.length,
    };
  } catch (error) {
    console.error("❌ Question Generation Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate questions",
      questions: [],
    };
  }
}

function buildSystemPrompt(profile) {
  const numberOfQuestions = profile.noOfQuestions || 5;
  
  return `You are an expert technical interviewer for the role of "${profile.jobPosition}".

ROLE CONTEXT:
- Position: ${profile.jobPosition}
- Required Experience: ${profile.jobExperience}
- Key Responsibilities: ${profile.jobDesc}

YOUR TASK:
Generate exactly ${numberOfQuestions} interview questions that assess:
1. Technical Knowledge - Core competencies for this role
2. Problem-Solving - Real-world scenario handling
3. Communication - Clarity and articulation
4. Experience - Relevant project examples

QUESTION GUIDELINES:
- Questions should be progressively challenging (beginner to advanced)
- Mix of behavioral and technical questions
- Keep questions concise and clear
- Avoid yes/no questions
- Focus on role-specific skills

RESPONSE FORMAT:
Return ONLY valid JSON array:
{
  "questions": [
    {
      "id": 1,
      "question": "string - the actual interview question",
      "difficulty": "easy | medium | hard",
      "category": "string - technical | behavioral | scenario",
      "expectedKeywords": ["keyword1", "keyword2"]
    }
  ]
}`;
}

function extractText(response) {
  return (
    response?.response?.text?.() ||
    response?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    ""
  );
}

function parseQuestionsResponse(responseText) {
  try {
    const cleanText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to parse questions response:", error);
    return { questions: [] };
  }
}

export async function generateQuestionsWithRetry(profile, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateQuestions(profile);
      if (result.success && result.questions.length > 0) {
        return result;
      }
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
      );
    }
  }

  return {
    success: false,
    error: lastError?.message || "Failed to generate questions after retries",
    questions: [],
  };
}
```

---

### 10.3.2 Response Evaluation — Evaluation Engine

The evaluation module processes each candidate response through a multi-stage pipeline including LLM-based scoring, sentiment analysis, and weighted scoring.

**File: `utils/evaluation-engine.js`**

```javascript
// Response Evaluation Module - Multi-stage Pipeline
// Processes responses through LLM evaluation, sentiment analysis, and scoring

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Main evaluation function - processes response through complete pipeline
 * Evaluation Dimensions (Weighted):
 * - Technical Accuracy:     35%
 * - Communication Clarity:  25%
 * - Relevance:              25%
 * - Confidence/Sentiment:   15%
 */
export async function evaluateResponse(evaluationData) {
  try {
    const {
      question,
      response,
      expectedKeywords = [],
      jobPosition = "Software Engineer",
    } = evaluationData;

    if (!question || !response) {
      return {
        success: false,
        error: "Question and response are required",
      };
    }

    // Stage 1: LLM-based evaluation
    const llmEvaluation = await performLLMEvaluation(
      question,
      response,
      expectedKeywords,
      jobPosition
    );

    // Stage 2: Sentiment and confidence analysis
    const sentimentAnalysis = analyzeSentiment(response);

    // Stage 3: Response quality metrics
    const responseMetrics = calculateResponseMetrics(response, expectedKeywords);

    // Stage 4: Calculate weighted overall score
    const overallScore = calculateWeightedScore(
      llmEvaluation,
      sentimentAnalysis,
      responseMetrics
    );

    return {
      success: true,
      evaluation: {
        llmEvaluation,
        sentimentAnalysis,
        responseMetrics,
        overallScore,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Evaluation Engine Error:", error);
    return {
      success: false,
      error: error.message || "Evaluation failed",
    };
  }
}

async function performLLMEvaluation(question, response, expectedKeywords, jobPosition) {
  const evaluationPrompt = `You are an expert technical interviewer evaluating a candidate response for the role of "${jobPosition}".

EVALUATION CONTEXT:
- Question: "${question}"
- Candidate Response: "${response}"
- Expected Keywords/Topics: ${expectedKeywords.join(", ") || "N/A"}

EVALUATE ON THESE DIMENSIONS:

1. TECHNICAL ACCURACY (0-10)
   - Is the information technically correct?
   - Does it demonstrate deep knowledge?
   - Are there any misconceptions?

2. COMMUNICATION CLARITY (0-10)
   - Is the response well-structured?
   - Is it easy to follow?
   - Clear articulation and logical flow?

3. RELEVANCE (0-10)
   - Does it directly address the question?
   - Are all points relevant?
   - Any off-topic information?

4. COMPLETENESS (0-10)
   - Does it cover key aspects?
   - Missing important points?
   - Depth of explanation?

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "technicalAccuracy": {
    "score": 0-10,
    "reasoning": "brief explanation"
  },
  "communicationClarity": {
    "score": 0-10,
    "reasoning": "brief explanation"
  },
  "relevance": {
    "score": 0-10,
    "reasoning": "brief explanation"
  },
  "completeness": {
    "score": 0-10,
    "reasoning": "brief explanation"
  },
  "keywordsCovered": ["keyword1", "keyword2"],
  "areasOfStrength": ["strength1", "strength2"],
  "areasForImprovement": ["improvement1", "improvement2"],
  "overallFeedback": "A comprehensive summary of the response quality"
}`;

  try {
    const response_data = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: evaluationPrompt,
    });

    const responseText = extractText(response_data);
    const parsed = parseEvaluationResponse(responseText);

    return parsed;
  } catch (error) {
    console.error("LLM Evaluation error:", error);
    return getDefaultEvaluation();
  }
}

function analyzeSentiment(response) {
  // Sentiment analysis based on confidence keywords and patterns
  const confidenceKeywords = {
    high: ["definitely", "certainly", "absolutely", "clearly", "obviously"],
    medium: ["probably", "likely", "generally", "usually", "typically"],
    low: ["maybe", "perhaps", "possibly", "might", "could", "uncertain"],
    uncertainty: ["uh", "um", "like", "you know", "honestly", "i guess"],
  };

  const lowerResponse = response.toLowerCase();
  let confidence = 5;

  const highCount = confidenceKeywords.high.filter((kw) =>
    lowerResponse.includes(kw)
  ).length;
  const lowCount = confidenceKeywords.low.filter((kw) =>
    lowerResponse.includes(kw)
  ).length;
  const uncertaintyCount = confidenceKeywords.uncertainty.filter((kw) =>
    lowerResponse.includes(kw)
  ).length;

  if (highCount > lowCount && highCount > uncertaintyCount) {
    confidence = 8 + Math.random() * 2;
  } else if (lowCount > highCount) {
    confidence = 4 + Math.random() * 2;
  } else if (uncertaintyCount > highCount) {
    confidence = 3 + Math.random() * 2;
  }

  return {
    confidenceScore: Math.round(confidence * 10) / 10,
    confidenceLevel: confidence > 7 ? "High" : confidence > 4 ? "Medium" : "Low",
    detectedPatterns: {
      highConfidenceMarkers: highCount,
      lowConfidenceMarkers: lowCount,
      uncertaintyMarkers: uncertaintyCount,
    },
  };
}

function calculateResponseMetrics(response, expectedKeywords) {
  const wordCount = response.split(/\s+/).length;
  const lowerResponse = response.toLowerCase();

  let keywordMatches = 0;
  const matchedKeywords = [];

  expectedKeywords.forEach((keyword) => {
    if (lowerResponse.includes(keyword.toLowerCase())) {
      keywordMatches++;
      matchedKeywords.push(keyword);
    }
  });

  const keywordCoverage =
    expectedKeywords.length > 0
      ? Math.round((keywordMatches / expectedKeywords.length) * 100)
      : 0;

  let verbosityScore = 5;
  if (wordCount < 20) verbosityScore = 2;
  else if (wordCount < 50) verbosityScore = 4;
  else if (wordCount < 200) verbosityScore = 8;
  else if (wordCount < 400) verbosityScore = 7;
  else verbosityScore = 5;

  return {
    wordCount,
    keywordMatches,
    matchedKeywords,
    keywordCoverage,
    verbosityScore: Math.round(verbosityScore * 10) / 10,
  };
}

function calculateWeightedScore(llmEvaluation, sentimentAnalysis, responseMetrics) {
  const weights = {
    technical: 0.35,
    clarity: 0.25,
    relevance: 0.25,
    confidence: 0.15,
  };

  const technicalScore = llmEvaluation.technicalAccuracy?.score || 5;
  const clarityScore = llmEvaluation.communicationClarity?.score || 5;
  const relevanceScore = llmEvaluation.relevance?.score || 5;
  const confidenceScore = (sentimentAnalysis.confidenceScore / 10) * 10;

  const overallScore = Math.round(
    (technicalScore * weights.technical +
      clarityScore * weights.clarity +
      relevanceScore * weights.relevance +
      confidenceScore * weights.confidence) * 10
  ) / 10;

  return {
    score: overallScore,
    percentage: Math.round((overallScore / 10) * 100),
    gradeLevel: getGradeLevel(overallScore),
    breakdown: {
      technical: technicalScore,
      clarity: clarityScore,
      relevance: relevanceScore,
      confidence: confidenceScore,
    },
  };
}

function getGradeLevel(score) {
  if (score >= 9) return "A+ (Excellent)";
  if (score >= 8) return "A (Very Good)";
  if (score >= 7) return "B (Good)";
  if (score >= 6) return "C (Satisfactory)";
  if (score >= 5) return "D (Needs Improvement)";
  return "F (Poor)";
}

function extractText(response) {
  return (
    response?.response?.text?.() ||
    response?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    ""
  );
}

function parseEvaluationResponse(responseText) {
  try {
    const cleanText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to parse evaluation response:", error);
    return getDefaultEvaluation();
  }
}

function getDefaultEvaluation() {
  return {
    technicalAccuracy: { score: 5, reasoning: "Unable to evaluate - using default scoring" },
    communicationClarity: { score: 5, reasoning: "Unable to evaluate - using default scoring" },
    relevance: { score: 5, reasoning: "Unable to evaluate - using default scoring" },
    completeness: { score: 5, reasoning: "Unable to evaluate - using default scoring" },
    keywordsCovered: [],
    areasOfStrength: ["Response provided"],
    areasForImprovement: ["Unable to analyze - please try again"],
    overallFeedback: "Evaluation system encountered an issue. Default scoring applied.",
  };
}
```

**File: `app/api/evaluate-answer/route.js`**

```javascript
// Response Evaluation API Endpoint
import { evaluateResponse } from "@/utils/evaluation-engine";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      question,
      response,
      expectedKeywords = [],
      jobPosition = "Software Engineer",
      mockId,
    } = body;

    if (!question || !response) {
      return Response.json(
        { success: false, error: "Question and response are required" },
        { status: 400 }
      );
    }

    const evaluationResult = await evaluateResponse({
      question,
      response,
      expectedKeywords,
      jobPosition,
    });

    if (!evaluationResult.success) {
      return Response.json(
        { success: false, error: evaluationResult.error },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      evaluation: evaluationResult.evaluation,
      mockId,
    });
  } catch (error) {
    console.error("❌ Evaluation Error:", error);
    return Response.json(
      { success: false, error: error.message || "Evaluation failed" },
      { status: 500 }
    );
  }
}
```

---

### 10.3.3 Speech-to-Text Integration

Converts audio input to text using AssemblyAI API with support for multiple languages and automatic punctuation.

**File: `app/api/transcribe/route.js`**

```javascript
// Speech-to-Text Integration using AssemblyAI
// Provides high-accuracy transcription with language detection

import { AssemblyAI } from "assemblyai";

/**
 * POST /api/transcribe
 * 
 * Transcribes audio file to text with language detection
 * 
 * Request:
 * - Form data with 'file' field containing audio blob
 * 
 * Response:
 * {
 *   "text": "transcribed text",
 *   "language": "detected language code",
 *   "confidence": confidence score
 * }
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload audio file
    const upload = await client.files.upload(buffer);

    // Transcribe with language detection and universal models
    const transcript = await client.transcripts.transcribe({
      audio: upload,
      language_detection: true,
      speech_models: ["universal-3-pro", "universal-2"],
      boost_search: ["microservices", "API", "database", "cloud"], // customize based on domain
      enable_automatic_punctuation: true,
    });

    return Response.json({ 
      text: transcript.text,
      language: transcript.language_code || "en",
      confidence: transcript.confidence || "N/A",
      status: transcript.status
    });
  } catch (err) {
    console.error("❌ Transcription Error:", err);
    return new Response(JSON.stringify({ error: "Transcription failed" }), {
      status: 500,
    });
  }
}
```

---

### 10.3.4 React Frontend — Interview Session Component

Client-side interview interface with question display, recording, and response submission.

**File: `app/dashboard/interview/[interviewId]/start/_components/QuestionsSection.jsx`**

```jsx
// Questions Display Component
// Shows interview questions with text-to-speech capability

"use client";
import React, { useEffect, useState } from "react";

function QuestionsSection({ 
  mockInterviewQuestion, 
  activeQuestionIndex, 
  setActiveQuestionIndex 
}) {
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
      {/* Question Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {mockInterviewQuestion?.map((_, index) => (
          <div
            key={index}
            className={`h-7 px-3 text-xs font-medium rounded-full border select-none ${
              activeQuestionIndex === index
                ? "bg-foreground text-background border-foreground"
                : index < activeQuestionIndex
                ? "bg-muted border-border text-muted-foreground"
                : "bg-transparent border-border text-muted-foreground opacity-40"
            }`}
          >
            Q{index + 1}
          </div>
        ))}
      </div>

      <div className="border-t border-border" />

      {/* Question Display */}
      <div className="flex-1">
        <p className="text-[15px] leading-[1.75] text-foreground">
          {mockInterviewQuestion?.[activeQuestionIndex]?.question}
        </p>
      </div>

      {/* Text-to-Speech Button */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => speak(mockInterviewQuestion?.[activeQuestionIndex]?.question)}
          className={`flex items-center gap-1.5 h-7 px-3 text-xs rounded-lg border transition-colors ${
            isSpeaking
              ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted"
          }`}
        >
          {isSpeaking ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
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
```

**File: `app/dashboard/interview/[interviewId]/start/_components/RecordAnswerSection.jsx`**

```jsx
// Recording and Answer Submission Component
// Handles audio recording, transcription, and response submission

"use client";
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
import AudioVisualizer from "@/components/ui/AudioVisualizer";

const MAX_RECORDING_SECONDS = 120;
const MIN_RECORDING_SECONDS = 2;

function RecordAnswerSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
  setActiveQuestionIndex,
  setQuestions,
  timeUp,
  setIsProcessing,
  setIsRecording,
}) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecordingLocal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recordingError, setRecordingError] = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [stream, setStream] = useState(null);
  const [answerSaved, setAnswerSaved] = useState(false);
  const { user } = useUser();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    setAnswerSaved(false);
    setUserAnswer('');
    setRecordingError(null);
  }, [activeQuestionIndex]);

  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      clearTimeout(maxTimerRef.current);
      stream?.getTracks().forEach(t => t.stop());
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stream]);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => {
    if (timeUp && isRecordingRef.current) stopRecording();
  }, [timeUp]);

  const startTimer = () => {
    setRecordSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(recordingTimerRef.current);
    clearTimeout(maxTimerRef.current);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    if (loading || isRecording || isProcessingRef.current) return;
    setRecordingError(null);
    setAnswerSaved(false);

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);

      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = handleStop;
      mediaRecorder.start(250);

      setIsRecordingLocal(true);
      if (setIsRecording) setIsRecording(true);
      startTimer();

      maxTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          toast("Maximum recording time reached");
          stopRecording();
        }
      }, MAX_RECORDING_SECONDS * 1000);

    } catch (err) {
      console.error("Microphone access error:", err);
      setRecordingError("Microphone access denied. Check browser permissions.");
    }
  };

  const stopRecording = useCallback(() => {
    stopTimer();
    stream?.getAudioTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingLocal(false);
    if (setIsRecording) setIsRecording(false);
  }, [stream, setIsRecording]);

  const handleStop = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (recordSeconds < MIN_RECORDING_SECONDS) {
      toast.error("Recording too short (minimum 2 seconds). Please try again.");
      isProcessingRef.current = false;
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Transcribing your answer...');
      if (setIsProcessing) setIsProcessing(true);

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      if (audioBlob.size < 1000) {
        toast.error("No audio detected. Please try again.");
        setLoading(false);
        if (setIsProcessing) setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      // Transcribe audio
      const formData = new FormData();
      formData.append("file", audioBlob, "answer.webm");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const transcribeData = await transcribeRes.json();

      if (!transcribeData.text) {
        toast.error("Could not transcribe audio. Please try again.");
        setLoading(false);
        if (setIsProcessing) setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      setUserAnswer(transcribeData.text);
      setLoadingMessage('Evaluating your response...');

      // Evaluate response
      const evaluateRes = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: mockInterviewQuestion[activeQuestionIndex]?.question,
          response: transcribeData.text,
          jobPosition: interviewData?.jobPosition || "Software Engineer",
          expectedKeywords: mockInterviewQuestion[activeQuestionIndex]?.expectedKeywords || [],
        }),
      });

      const evaluateData = await evaluateRes.json();

      if (evaluateData.success) {
        // Save answer with evaluation
        await fetch("/api/save-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mockIdRef: interviewData?.mockId,
            question: mockInterviewQuestion[activeQuestionIndex]?.question,
            userAns: transcribeData.text,
            feedback: JSON.stringify(evaluateData.evaluation?.llmEvaluation),
            rating: evaluateData.evaluation?.overallScore?.score?.toString(),
            userEmail: user?.emailAddresses?.[0]?.emailAddress,
            createdAt: moment().format("DD-MM-YYYY"),
          }),
        });

        setAnswerSaved(true);
        toast.success("Answer saved successfully!");
      }

      setLoading(false);
      if (setIsProcessing) setIsProcessing(false);

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
      setLoading(false);
      if (setIsProcessing) setIsProcessing(false);
    } finally {
      isProcessingRef.current = false;
    }
  };

  return (
    <div className="bg-background rounded-2xl border border-border p-5 flex flex-col gap-5">
      {recordingError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-600">{recordingError}</span>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden bg-muted h-40">
        {isRecording && <AudioVisualizer />}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </button>

        <span className="text-sm font-mono text-muted-foreground">
          {formatTime(recordSeconds)} / {formatTime(MAX_RECORDING_SECONDS)}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-600">{loadingMessage}</span>
        </div>
      )}

      {answerSaved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">Answer saved! You can move to the next question.</span>
        </div>
      )}

      {userAnswer && (
        <div className="bg-muted p-3 rounded-lg border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">YOUR TRANSCRIBED RESPONSE:</p>
          <p className="text-sm text-foreground leading-relaxed">{userAnswer}</p>
        </div>
      )}
    </div>
  );
}

export default RecordAnswerSection;
```

**File: `app/dashboard/interview/[interviewId]/start/page.jsx`**

```jsx
// Interview Session Main Component
// Orchestrates the interview flow with questions, recording, and evaluation

"use client";
import React, { useState, useEffect } from 'react';
import QuestionsSection from './_components/QuestionsSection';
import RecordAnswerSection from './_components/RecordAnswerSection';
import { Button } from "@/components/ui/button";

function InterviewStart({ params }) {
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [interviewData, setInterviewData] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Fetch interview data and questions
    fetchInterviewData();
  }, [params.interviewId]);

  useEffect(() => {
    // Session timer
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchInterviewData = async () => {
    try {
      // Fetch from your database or API
      // const data = await db.select().from(MockInterview).where(...);
      // setInterviewData(data);
      // Parse questions from JSON
      // const questions = JSON.parse(data.jsonMockResp);
      // setMockInterviewQuestion(questions);
    } catch (error) {
      console.error("Error fetching interview data:", error);
    }
  };

  const handleNext = () => {
    if (activeQuestionIndex < mockInterviewQuestion.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    // Generate report and redirect
    // await generateSessionReport(...);
    // window.location.href = `/dashboard/interview/${params.interviewId}/feedback`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Interview Session
            </h1>
            <p className="text-muted-foreground">
              {interviewData?.jobPosition || "Loading..."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Session Time</p>
            <p className="text-2xl font-bold text-foreground">{formatTime(sessionTime)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions Section */}
          <div className="lg:col-span-1">
            <QuestionsSection
              mockInterviewQuestion={mockInterviewQuestion}
              activeQuestionIndex={activeQuestionIndex}
              setActiveQuestionIndex={setActiveQuestionIndex}
            />
          </div>

          {/* Recording Section */}
          <div className="lg:col-span-2">
            <RecordAnswerSection
              mockInterviewQuestion={mockInterviewQuestion}
              activeQuestionIndex={activeQuestionIndex}
              interviewData={interviewData}
              setActiveQuestionIndex={setActiveQuestionIndex}
              setQuestions={setMockInterviewQuestion}
              timeUp={timeUp}
              setIsProcessing={setIsProcessing}
              setIsRecording={setIsRecording}
            />

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handlePrevious}
                disabled={activeQuestionIndex === 0 || isRecording || isProcessing}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={activeQuestionIndex === mockInterviewQuestion.length - 1 || isRecording || isProcessing}
                className="flex-1"
              >
                Next
              </Button>
              {activeQuestionIndex === mockInterviewQuestion.length - 1 && (
                <Button
                  onClick={handleFinish}
                  disabled={isRecording || isProcessing}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Finish Interview
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewStart;
```

---

### 10.3.5 Database Schema

**File: `utils/schema.js`**

```javascript
// Database Schema - Drizzle ORM
// Defines the data models for mock interviews and user answers

import { pgTable, serial, varchar, text } from "drizzle-orm/pg-core";

export const MockInterview = pgTable('mockInterview', {
  id: serial('id').primaryKey(),
  jsonMockResp: text('jsonMockResp').notNull(),
  jobPosition: varchar('jobPosition').notNull(),
  jobDesc: varchar('jobDesc').notNull(),
  jobExperience: varchar('jobExperience').notNull(),
  createdBy: varchar('createdBy').notNull(),
  createdAt: varchar('createdAt').notNull(),
  mockId: varchar('mockId').notNull().unique(),
});

export const UserAnswer = pgTable('userAnswer', {
  id: serial('id').primaryKey(),
  mockIdRef: varchar('mockId').notNull(),
  question: varchar('question').notNull(),
  userAns: text('userAns'),
  feedback: text('feedback'),
  rating: varchar('rating'),
  userEmail: varchar('userEmail'),
  createdAt: varchar('createdAt'),
});
```

---

This implementation chapter provides complete code examples for all key modules of the AI-Powered Mock Interview System, demonstrating production-ready implementations using Next.js, Gemini API, and modern React patterns.
