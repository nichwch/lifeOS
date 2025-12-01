import { NextResponse } from "next/server";
import {
  summaryFunctionDefinition,
  summaryMessages,
  SummaryResponseBody,
  summaryToolDefinition,
} from "@/lib/summarize";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "gpt-5.1";

interface SummarizeRequestBody {
  week: string;
  notes: string;
  context?: string;
  model?: string;
}

const parseSummary = (raw: any): SummaryResponseBody["summary"] | null => {
  const message = raw?.choices?.[0]?.message;
  const maybeArgs =
    message?.function_call?.arguments ??
    message?.tool_calls?.[0]?.function?.arguments ??
    (typeof message?.content === "string" ? message.content : null);

  if (typeof maybeArgs !== "string") {
    return null;
  }

  try {
    return JSON.parse(maybeArgs);
  } catch (error) {
    console.error("Failed to parse summary payload", { maybeArgs, error });
    return null;
  }
};

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-openrouter-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenRouter API key" },
      { status: 401 }
    );
  }

  let body: SummarizeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { week, notes, context = "", model } = body;

  if (!week || !notes) {
    return NextResponse.json(
      { error: "Both `week` and `notes` fields are required" },
      { status: 400 }
    );
  }
// bump
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        temperature: 0.5,
        messages: summaryMessages(notes, context),
        tools: [summaryToolDefinition],
        tool_choice: {
          type: "function",
          function: { name: summaryFunctionDefinition.name },
        },
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.log(errorResponse);
      return NextResponse.json(
        { error: "OpenRouter request failed", details: errorResponse },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary = parseSummary(data);

    if (!summary) {
      return NextResponse.json(
        { error: "Unable to parse summary response" },
        { status: 422 }
      );
    }

    return NextResponse.json({ week, summary } satisfies SummaryResponseBody);
  } catch (error) {
    console.error("Unexpected error summarizing notes", error);
    return NextResponse.json(
      { error: "Unexpected error summarizing notes" },
      { status: 500 }
    );
  }
}

