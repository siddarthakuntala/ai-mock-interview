import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt missing" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    // Safe text extraction
    const text =
      result?.response?.text?.() ||
      result?.text ||
      result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini returned unexpected response:", result);
      return Response.json(
        { error: "AI returned empty response" },
        { status: 500 }
      );
    }

    return Response.json({ text });

  } catch (error) {
    console.error("🔥 Gemini API Error:", error);

    return Response.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}