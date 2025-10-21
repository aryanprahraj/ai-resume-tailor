import { NextResponse } from "next/server";
import rateLimit from "express-rate-limit";

// ✅ Ensure this route uses Node.js runtime (not Edge)
export const runtime = "nodejs";

// 🧠 Rate limiter: 10 requests per 5 minutes per IP
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max requests per IP
  message: "Too many requests from this IP. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export async function POST(req: Request) {
  try {
    // 🧱 Run limiter manually
    await new Promise((resolve, reject) =>
      // @ts-ignore
      limiter(req, {} as any, (result: any) =>
        result instanceof Error ? reject(result) : resolve(result)
      )
    );

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resume or job description." },
        { status: 400 }
      );
    }

    // 🔒 Securely call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume writer who tailors resumes professionally.",
          },
          {
            role: "user",
            content: `Here is my resume:\n\n${resumeText}\n\nHere is the job description:\n\n${jobDescription}\n\nPlease tailor my resume accordingly.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const tailoredResume =
      data?.choices?.[0]?.message?.content || "No response from OpenAI.";

    return NextResponse.json({ tailoredResume });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
