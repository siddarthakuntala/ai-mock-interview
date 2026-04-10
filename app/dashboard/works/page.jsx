"use client";

import React from "react";

export default function HowItWorksPage() {
  return (
    <div className="p-10 max-w-5xl mx-auto">

      <h1 className="text-4xl font-bold text-primary mb-6">
        How It Works
      </h1>

      <p className="text-gray-600 mb-10 text-lg">
        Our AI-powered mock interview platform helps you practice real
        interviews with instant feedback.
      </p>

      <div className="space-y-6">

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-2">
            1. Select Your Job Role
          </h2>
          <p className="text-gray-600">
            Choose your target role, experience level, and technology stack.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-2">
            2. AI Generates Interview Questions
          </h2>
          <p className="text-gray-600">
            Our AI generates customized questions similar to real company
            interviews.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-2">
            3. Record Your Answers
          </h2>
          <p className="text-gray-600">
            Answer questions using voice or text while the AI evaluates your
            responses.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-2">
            4. Get Instant Feedback
          </h2>
          <p className="text-gray-600">
            Receive ratings, suggestions, and improvements to boost your
            interview performance.
          </p>
        </div>

      </div>
    </div>
  );
}