"use client"
import React, { useState } from 'react'
import { db } from "@/utils/db";
import { GoogleGenAI } from "@google/genai";
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { LoaderIcon } from 'lucide-react';
import { MockInterview } from '@/utils/schema';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
function AddNewInterview() {
    const [openDailog, setOpenDailog] = useState(false)
    const [jobPosition, setJobPosition] = useState();
    const [jobDesc, setJobDesc] = useState();
    const [jobExperience, setJobExperience] = useState();
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const router = useRouter();
    const onSubmit = async (e) => {
        setLoading(true)
        e.preventDefault();

        console.log(jobPosition, jobDesc, jobExperience);

        const inputPrompt = `
You are an expert technical interviewer.

Input:
- Job Description (JD): ${jobDesc}
- Role: ${jobPosition}
- Candidate Experience: ${jobExperience}

Task:
Generate exactly 5 interview questions tailored to the JD, role, and experience level.

Strict Rules:
1. Output MUST be valid JSON.
2. Do NOT include markdown, explanations, comments, or extra text.
3. Do NOT wrap output in json or code fences.
4. All keys MUST use double quotes.
5. All string values MUST use double quotes.
6. No trailing commas.
7. No text outside the JSON object.
8. Return exactly 5 items in the questions array.
9. Questions must be specific, non-generic, and relevant to the JD.
10. Answers must be concise and technically accurate.

Required Output Format:
{
  "questions": [
    {
      "question": "string",
      "answer": "string"
    },
    {
      "question": "string",
      "answer": "string"
    },
    {
      "question": "string",
      "answer": "string"
    },
    {
      "question": "string",
      "answer": "string"
    },
    {
      "question": "string",
      "answer": "string"
    }
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
            // console.log("--------------------RAW AI RESPONSE:-------------"+data)
            if (!data?.text) {
                console.log("Invalid AI response:", data);
                setLoading(false);
                return;
            }

            const cleanText = data.text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const parsed = JSON.parse(cleanText);

            console.log("AI Response:", parsed);
            if (parsed) {
                const resp = await db.insert(MockInterview)
                    .values({
                        mockId: uuidv4(),
                        jsonMockResp: parsed,
                        jobPosition: jobPosition,
                        jobDesc: jobDesc,
                        jobExperience: jobExperience,

                        createdBy: user?.primaryEmailAddress?.emailAddress,
                        createdAt: moment().format('DD-MM-YYYY')
                    })
                    .returning({ mockId: MockInterview.mockId });

                console.log("inserted");
                if (resp) {
                    setOpenDailog(false);
                    router.push('/dashboard/interview/' + resp[0]?.mockId)
                }
            } else {
                console.log("error in inserting");
            }

        } catch (error) {
            console.error("Error:", error);
        }
        setLoading(false);
    };
    return (
        <div>
            <div className="p-10 border rounded-lg bg-secondary
        hover:scale-105 hover:shadow-md cursor-pointer transition-all"
                onClick={() => setOpenDailog(true)}>
                <h2 className="text-lg">+ Add new</h2>
            </div>
            <Dialog open={openDailog}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle className='text-2xl'>Interview Detail</DialogTitle>
                        <DialogDescription>
                            Enter job details for generating interview questions
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onSubmit}>
                        <div>
                            <h2>Add Details</h2>

                            <div className='my-3'>
                                <label>Job Role</label>
                                <input
                                    placeholder='Ex. Full Stack Developer'
                                    required
                                    onChange={(e) => setJobPosition(e.target.value)}
                                />
                            </div>

                            <div className='my-3'>
                                <label>Job Description</label>
                                <input
                                    placeholder='Ex. React, Angular, Node js, etc'
                                    required
                                    onChange={(e) => setJobDesc(e.target.value)}
                                />
                            </div>

                            <div className='my-3'>
                                <label>Experience</label>
                                <input
                                    placeholder='Ex. 1'
                                    type='number'
                                    max={50}
                                    required
                                    onChange={(e) => setJobExperience(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className='flex gap-5 justify-end'>
                            <button type='button' onClick={() => setOpenDailog(false)}>
                                Cancel
                            </button>
                            <button type='submit' disabled={loading}>
                                {loading ?
                                    <>
                                        <LoaderIcon className='animate-spin mr-2' />'Generating from AI'
                                    </> : 'Start Interview'
                                }
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddNewInterview