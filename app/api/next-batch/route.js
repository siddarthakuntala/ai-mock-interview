export async function POST(req) {
  try {
    const { history, role } = await req.json();

    const prompt = `
You are an expert interviewer.

Based on previous Q&A, generate next 3 interview questions.

Role: ${role}

Return ONLY JSON:
{
  "questions": [
    { "question": "..." },
    { "question": "..." },
    { "question": "..." }
  ]
}

History:
${JSON.stringify(history)}
`;

    const res = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    const clean = data.text
      ?.replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(clean);

    return Response.json(parsed);

  } catch (err) {
    return Response.json({
      questions: [
        { question: "Can you explain that further?" },
        { question: "What challenges did you face?" },
        { question: "Can you give an example?" }
      ]
    });
  }
}