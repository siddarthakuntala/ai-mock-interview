import { NextResponse } from "next/server";

// TEMP MOCK (replace with DB later)
let mockDB = {};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mockId = searchParams.get("mockId");

    if (!mockId) {
      return NextResponse.json({ error: "Missing mockId" }, { status: 400 });
    }

    const questions = mockDB[mockId] || [];

    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}