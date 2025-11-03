import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables first

import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextResponse } from "next/server";

// 🧩 Check Environment Setup (for debugging)
console.log("ENV CHECK =>", {
  OPENAI_KEY: process.env.OPENAI_KEY ? "✅" : "❌ MISSING",
  ASTRA_DB_APPLICATION_TOKEN: process.env.ASTRA_DB_APPLICATION_TOKEN ? "✅" : "❌ MISSING",
  ASTRA_DB_API_ENDPOINT: process.env.ASTRA_DB_API_ENDPOINT ? "✅" : "❌ MISSING",
  ASTRA_DB_NAMESPACE: process.env.ASTRA_DB_NAMESPACE ? "✅" : "❌ MISSING",
});

// 🧠 Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// 🧱 Initialize Astra DB client
const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
  namespace: process.env.ASTRA_DB_NAMESPACE,
});

// 🚀 POST handler for chat
export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages?.[messages.length - 1]?.content;

    if (!latestMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // ✨ Create embedding for user query
    const embeddingResponse = await openai.embeddings.create({
      input: latestMessage,
      model: "text-embedding-3-small",
    });

    const embedding = embeddingResponse.data?.[0]?.embedding;
    const collection = await db.collection("portfolio");

    // 🔍 Vector search in Astra DB
    const cursor = collection.find(null, {
      sort: { $vector: embedding },
      limit: 5,
    });
    const documents = await cursor.toArray();

    const docContext = `
      START CONTEXT
      ${documents.map((doc) => doc.description || "").join("\n")}
      END CONTEXT
    `;

    // 🧩 System prompt for RAG-style chat
    const ragPrompt = [
      {
        role: "system",
        content: `
          You are an AI assistant representing Piyush Agarwal in his Portfolio App.
          Use markdown formatting when appropriate.
          ${docContext}
          If the answer is not found in the context, respond:
          "I'm sorry, I do not know the answer."
        `,
      },
    ];

    // 🧠 Stream response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error("🔥 SERVER ERROR =>", error);

    // 🩸 Smarter error handling
    const errorMessage =
      error?.message?.includes("quota") || error?.code === "insufficient_quota"
        ? "OpenAI billing/quota issue — check your plan or key."
        : error?.message || "Unknown server error.";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
