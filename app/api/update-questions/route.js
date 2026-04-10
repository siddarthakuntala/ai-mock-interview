import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const { mockId, questions } = await req.json();

    await db
      .update(MockInterview)
      .set({
        jsonMockResp: JSON.stringify({ questions })
      })
      .where(eq(MockInterview.mockId, mockId));

    return Response.json({ success: true });

  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}