"use client";

import { MockInterview } from '@/utils/schema';
import React, { useEffect, use, useState } from 'react';
import { db } from '@/utils/db';
import { eq } from 'drizzle-orm';
import Webcam from 'react-webcam';
import { CameraIcon } from 'lucide-react';
import { useRouter } from "next/navigation";
import AudioVisualizer from "@/components/ui/AudioVisualizer";

function Interview({ params }) {
    const [interviewData, setInterviewData] = useState(null);
    const [webCamEnable, setWebCamEnable] = useState(false);
    const [camError, setCamError] = useState(false);
    const [loading, setLoading] = useState(true);

    const resolvedParams = use(params);
    const interviewId = resolvedParams.interviewId;
    const router = useRouter();

    useEffect(() => {
        if (interviewId) GetInterviewDetails();
    }, [interviewId]);

    const GetInterviewDetails = async () => {
        try {
            const result = await db
                .select()
                .from(MockInterview)
                .where(eq(MockInterview.mockId, interviewId));
            setInterviewData(result[0] ?? null);
        } catch (error) {
            console.error("DB Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartInterview = async () => {
        const elem = document.documentElement;
        try {
            if (elem.requestFullscreen) await elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
            else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
        } catch (err) {
            console.log("Fullscreen failed:", err);
        }
        setTimeout(() => {
            router.push(`/dashboard/interview/${interviewId}/start`);
        }, 200);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-muted-foreground animate-pulse">Loading interview details...</p>
            </div>
        );
    }

    if (!interviewData) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Interview not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 p-6 md:p-10">

            <div className="mb-8">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                    Interview prep
                </p>
                <h1 className="text-xl font-medium text-foreground">Let's get started</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                {/* Job details card */}
                <div className="bg-background border border-border rounded-xl p-5 flex flex-col gap-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Job details
                    </p>

                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Position</p>
                            <p className="text-sm font-medium">{interviewData.jobPosition}</p>
                        </div>
                        <div className="border-t border-border pt-3">
                            <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                            <p className="text-sm">{interviewData.jobDesc}</p>
                        </div>
                        <div className="border-t border-border pt-3">
                            <p className="text-xs text-muted-foreground mb-0.5">Experience</p>
                            <p className="text-sm">{interviewData.jobExperience} {interviewData.jobExperience === 1 ? 'year' : 'years'}</p>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Enable your webcam and microphone when ready. You'll have time to read each question before answering.
                        </p>
                    </div>
                </div>

                {/* Webcam panel */}
                <div className="flex flex-col gap-3">
                    {webCamEnable && !camError ? (
                        <div className="rounded-xl overflow-hidden border border-border bg-black">
                            <Webcam
                                onUserMedia={() => { setWebCamEnable(true); setCamError(false); }}
                                onUserMediaError={() => { setWebCamEnable(false); setCamError(true); }}
                                mirrored={true}
                                className="w-full aspect-[4/3] object-cover"
                            />
                        </div>
                    ) : (
                        <div className="bg-muted border border-border rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-3">
                            <CameraIcon className="w-10 h-10 text-muted-foreground opacity-40" />
                            <p className="text-xs text-muted-foreground">
                                {camError ? 'Camera access denied' : 'Camera disabled'}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => { setCamError(false); setWebCamEnable(true); }}
                        className="w-full h-9 text-sm border border-border rounded-lg bg-transparent text-foreground hover:bg-muted transition-colors"
                    >
                        {webCamEnable ? 'Webcam active' : 'Enable webcam & microphone'}
                    </button>

                    {camError && (
                        <p className="text-xs text-red-500 text-center">
                            Could not access camera. Check browser permissions and try again.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
                <button
                    onClick={handleStartInterview}
                    className="h-9 px-5 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                    Start interview
                </button>
            </div>
        </div>
    );
}

export default Interview;