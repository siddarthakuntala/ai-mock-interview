export async function POST(req) {
    try {
        const { answer, question } = await req.json();

        const prompt = `
You are an expert technical interviewer conducting a real-time interview.

Context:
- Previous Question: ${question}
- Candidate Answer: ${answer}

Your task is to analyze the candidate's answer and generate the NEXT question intelligently.

Evaluation Guidelines:
1. Assess answer quality:
   - Correctness (Is it technically accurate?)
   - Depth (Surface-level vs detailed)
   - Clarity (Clear vs vague/confused)

2. Decide next step:
   - If answer is WEAK → ask a simpler or clarification question
   - If answer is PARTIAL → ask a follow-up to dig deeper
   - If answer is STRONG → ask a more advanced or related question
   - If topic is sufficiently covered → move to a new relevant topic

3. Maintain interview flow:
   - Questions should feel natural and progressive
   - Avoid repeating the same question
   - Keep it relevant to the role

4. Keep questions concise and realistic (like real interviews)

Return ONLY valid JSON:
{
  "analysis": {
    "quality": "poor | average | good",
    "reason": "short explanation"
  },
  "next_question": "string",
  "end": false
}
`;

        const res = await fetch("http://localhost:3000/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();

        const cleanText = data.text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleanText);

        return Response.json(parsed);

    } catch (error) {
        return Response.json({
            next_question: "Tell me about yourself.",
            end: false
        });
    }
}