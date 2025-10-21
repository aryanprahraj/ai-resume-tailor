import { NextResponse } from "next/server";
import rateLimit from "express-rate-limit";

// 🧠 Create a rate limiter: 10 requests per 5 minutes per IP
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max requests per IP
  message: "Too many requests from this IP. Please try again in a few minutes.",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable deprecated headers
});

export async function POST(req: Request) {
  try {
    // 🧱 Run limiter manually (Express-style middleware inside Next.js)
    await new Promise((resolve, reject) =>
      // @ts-ignore - Express limiter isn't typed for Next.js
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

    // 🧩 Call OpenAI API (securely server-side)
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
              "You are an expert career assistant who tailors resumes professionally to job descriptions.",
          },
          {
            role: "user",
            content: `Here is my resume:\n\n${resumeText}\n\nHere is the job description:\n\n${jobDescription}\n\nTailor my resume to this job.`,
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
