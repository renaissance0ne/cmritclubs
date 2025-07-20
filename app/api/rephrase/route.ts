import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: Ensure your Gemini API key is set in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text to rephrase is required." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Polish and rephrase the following text to be more professional and clear for a formal permission letter. Do not add any introductory or concluding phrases, just provide the rephrased text directly:\n\n"${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rephrasedText = response.text();

    return NextResponse.json({ rephrasedText });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to rephrase text. Please try again." },
      { status: 500 }
    );
  }
}
