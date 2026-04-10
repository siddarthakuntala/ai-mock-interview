import { AssemblyAI } from "assemblyai";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await client.files.upload(buffer);

    const transcript = await client.transcripts.transcribe({
      audio: upload,
      language_detection: true,
      speech_models: ["universal-3-pro", "universal-2"],
    });

    return Response.json({ text: transcript.text });
  } catch (err) {
    console.error("Transcription Error:", err);
    return new Response(JSON.stringify({ error: "Transcription failed" }), {
      status: 500,
    });
  }
}