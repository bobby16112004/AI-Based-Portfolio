import "dotenv/config";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import db from "@/db/loadDb";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages?.[messages.length - 1]?.content;

    if (!latestMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // ✅ Astra DB Collection Access — runtime only
    let collection = null;
    if (db) {
      try {
        collection = await db.collection("portfolio");
      } catch (err) {
        if (err.message?.includes("Collection not found")) {
          console.log("⚙️ Creating 'portfolio' collection in Astra DB...");
          await db.createCollection("portfolio", {
            vector: { dimension: 1536, metric: "cosine" },
          });
          collection = await db.collection("portfolio");
        } else throw err;
      }
    }

    // ==============================
    // 🧩 TEMP RESPONSE (Free Mode)
    // ==============================
    return NextResponse.json({
      message: `👋 Hello! I’m Himanshu Pal’s personal AI — trained on his real projects, ideas, and experiences.

The live OpenAI service is currently offline, but I can still tell you about Himanshu’s work, tech stack, or portfolio projects.

This AI portfolio is built with Next.js, OpenAI API, Astra DB, and Tailwind CSS, and it’s fully responsive.

Himanshu has also developed multiple projects, including:
🎬 Movie App
🌍 WorldAtlas App
📝 Todo List (Full Stack + Node.js)
💾 File Creator
🌦️ Weather App
💱 Currency Converter
😂 Joke Generator
💼 Standard Portfolio

He’s passionate about full-stack development and keeps building creative, production-grade projects.
Thanks for visiting! 🚀`,
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR =>", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
