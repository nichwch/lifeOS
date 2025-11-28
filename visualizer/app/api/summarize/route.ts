import { NextResponse } from "next/server";
import {
  summaryFunctionDefinition,
  summaryMessages,
  SummaryResponseBody,
} from "@/lib/summarize";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/openai/gpt-4o-mini";

interface SummarizeRequestBody {
  week: string;
  notes: string;
  context?: string;
  model?: string;
}

const parseSummary = (raw: any): SummaryResponseBody["summary"] | null => {
  const functionCall = raw?.choices?.[0]?.message?.function_call;
  if (!functionCall?.arguments) {
    return null;
  }

  try {
    const parsed = JSON.parse(functionCall.arguments);
    return parsed;
  } catch (error) {
    console.error("Failed to parse function call arguments", error);
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
        functions: [summaryFunctionDefinition],
        function_call: { name: summaryFunctionDefinition.name },
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
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

