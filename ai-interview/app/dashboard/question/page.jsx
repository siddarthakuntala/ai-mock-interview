"use client";

import React from "react";

export default function QuestionsPage() {
  return (
    <div className="p-10 max-w-5xl mx-auto">

      <h1 className="text-4xl font-bold text-primary mb-6">
        AI Interview Questions
      </h1>

      <p className="text-gray-600 mb-10 text-lg">
        Our AI generates realistic technical interview questions based on your
        selected role, tech stack, and experience level.
      </p>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-3">
            Technical Questions
          </h2>
          <p className="text-gray-600">
            Questions based on programming languages, frameworks, and
            technologies you choose.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-3">
            Behavioral Questions
          </h2>
          <p className="text-gray-600">
            AI evaluates how you explain experiences, teamwork, and
            decision-making scenarios.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-3">
            Problem Solving
          </h2>
          <p className="text-gray-600">
            Real interview-style coding and logic questions designed to test
            analytical thinking.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-3">
            AI Evaluation
          </h2>
          <p className="text-gray-600">
            Your answers are analyzed and rated by AI with feedback to improve
            performance.
          </p>
        </div>

      </div>
    </div>
  );
}