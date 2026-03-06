"use client";

import { MockInterview } from '@/utils/schema';
import React, { useEffect, use, useState } from 'react';
import { db } from '@/utils/db';
import { eq } from 'drizzle-orm';
import Webcam from 'react-webcam';
import { WebcamIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from "next/link";

function Interview({ params }) {
    const [interviewData, setInterviewData] = useState();
    const [webCamEnable, setWebCamEnable] = useState(false);
    const resolvedParams = use(params);   // ✅ unwrap Promise
    const interviewId = resolvedParams.interviewId;

    useEffect(() => {
        console.log("Interview ID:", interviewId);
        GetInterviewDetails();
    }, [interviewId]);

    const GetInterviewDetails = async () => {
        try {
            const result = await db
                .select()
                .from(MockInterview)
                .where(eq(MockInterview.mockId, interviewId));

            console.log("DB Result:", result);
            setInterviewData(result[0]);

        } catch (error) {
            console.error("DB Error:", error);
        }
    };

    return (
        <div className='my-10 '>
            <h2 className='font-bold text-2xl'>Let's Get Started</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                <div className='flex flex-col my-5 gap-5'>
                    <div className='flex flex-col p-5 rounded-b-lg border gap-5'>
                        <h2 className='text-lg'>
                            <strong>Job Position:</strong> {interviewData?.jobPosition}
                        </h2>

                        <h2 className='text-lg'>
                            <strong>Job Description:</strong> {interviewData?.jobDesc}
                        </h2>

                        <h2 className='text-lg'>
                            <strong>Job Experience:</strong> {interviewData?.jobExperience}
                        </h2>
                    </div>
                </div>
                <div>
                    {webCamEnable ? <Webcam
                        onUserMedia={() => setWebCamEnable(true)}
                        onUserMediaError={() => setWebCamEnable(false)}
                        mirrored={true}
                        style={{
                            height: 300,
                            width: 300
                        }}
                    />
                        :
                        <>
                            <WebcamIcon className='h-72 w-full my-7 p-20 bg-secondary rounded-lg border' />
                            <Button variant="ghost" className='w-full' onClick={() => setWebCamEnable(true)}>Enable Webcam and Microphone</Button>
                        </>
                    }
                </div>

            </div>
            <div className='flex justify-end items-end'>
                <Link href={`/dashboard/interview/${interviewId}/start`}>
                    <Button>Start Interview</Button>
                </Link>
            </div>
        </div>
    )
}

export default Interview;