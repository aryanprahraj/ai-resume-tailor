import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resume or job description." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OpenAI API key." },
        { status: 500 }
      );
    }

    // 🧠 Structured prompt enforcing a complete JSON resume
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              You are a resume-generation assistant.
              Always respond ONLY in valid JSON format, no explanations or markdown.
              Create a structured, tailored resume object with this exact structure:

              {
                "profile": "2–3 sentence summary paragraph",
                "education": [
                  { "degree": "string", "institution": "string", "year": "string" }
                ],
                "experience": [
                  { "title": "string", "company": "string", "dates": "string", "details": ["bullet 1", "bullet 2"] }
                ],
                "skills": ["list", "of", "skills"],
                "projects": [
                  { "name": "string", "description": "string" }
                ],
                "certificates": ["list of certifications or awards"]
              }

              Do NOT include placeholders or text like "[Your Name]".
              Use bullet points for details. Tailor the resume specifically to the job description.
            `,
          },
          {
            role: "user",
            content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
          },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return NextResponse.json({ error: "No response from AI." }, { status: 500 });
    }

    // ✅ Safely parse JSON response
    let structuredResume;
    try {
      structuredResume = JSON.parse(text);
    } catch (err) {
      console.error("Error parsing AI JSON:", err);
      return NextResponse.json({ error: "Invalid JSON from AI.", raw: text }, { status: 500 });
    }

    return NextResponse.json({ resume: structuredResume });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
