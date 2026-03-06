import { NextResponse } from "next/server";
import { db } from "@/utils/db";       // adjust path if needed
import { UserAnswer } from "@/utils/schema";

export async function POST(req) {
  try {
    const body = await req.json();

    const resp = await db.insert(UserAnswer).values({
      mockIdRef: body.mockIdRef,
      question: body.question,
      userAns: body.userAns,
      feedback: body.feedback,
      rating: body.rating,
      userEmail: body.userEmail,
      createdAt: body.createdAt,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Save Answer Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}