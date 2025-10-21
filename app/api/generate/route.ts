import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ Use Node.js runtime

// 🧠 Simple in-memory rate limiter
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 10;
const ipTracker = new Map<string, { count: number; firstRequestTime: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();

    // 🧩 Track IP requests
    const record = ipTracker.get(ip);
    if (record) {
      if (now - record.firstRequestTime < RATE_LIMIT_WINDOW) {
        if (record.count >= MAX_REQUESTS) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          );
        }
        record.count++;
      } else {
        ipTracker.set(ip, { count: 1, firstRequestTime: now });
      }
    } else {
      ipTracker.set(ip, { count: 1, firstRequestTime: now });
    }

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resume or job description." },
        { status: 400 }
      );
    }

    // 🧩 OpenAI API call
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
