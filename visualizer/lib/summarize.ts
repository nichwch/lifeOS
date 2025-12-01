const SUMMARY_INSTRUCTIONS = `Please summarize the following weekly notes, given the provided context.
Write everything in the second person and in the past tense (e.g. "This week, you were focused on fixing your sleep").
You can ignore TODOs and other transient content — focus on the big picture. Use the existing context to stay consistent with ongoing themes.`;

export const summaryMessages = (notes: string, context: string) => [
  {
    role: "system",
    content: "You are a meticulous assistant that keeps long-running journals consistent and structured.",
  },
  {
    role: "user",
    content: `${SUMMARY_INSTRUCTIONS}

Context:
${context || "No prior context provided."}

Weekly notes:
${notes}`,
  },
];

export const summaryFunctionDefinition = {
  name: "generate_summary",
  description:
    "Generate a structured summary of the weekly notes. Include an updated context if the author's life has changed since the last summary.",
  parameters: {
    type: "object",
    properties: {
      overall_summary: {
        type: "string",
        description: "Brief overall summary of the week, in the second person past tense.",
      },
      main_themes: {
        type: "array",
        items: { type: "string" },
        description: "A short list of the main themes present in the notes.",
      },
      ideas: {
        type: "string",
        description:
          "Ideas or explorations the author wants to pursue. Leave blank if there aren't any, in the second person past tense.",
      },
      dreams: {
        type: "string",
        description:
          "Dreams recorded from sleeping. Leave blank if there aren't any, in the second person past tense.",
      },
      life: {
        type: "string",
        description: "Notable life events to remember. Leave blank if none, in the second person past tense.",
      },
      gratitude: {
        type: "string",
        description: "Things the author expressed gratitude for. Leave blank if none, in the second person past tense.",
      },
      complaints: {
        type: "string",
        description: "Complaints or frustrations. Leave blank if none, in the second person past tense.",
      },
      questions: {
        type: "string",
        description: "Questions to prompt further journaling.",
      },
      answers: {
        type: "string",
        description: "Advice or answers to open questions in the author's life.",
      },
      context: {
        type: "string",
        description:
          "Updated summary of the author's overall life. Start with the old context and only change if life has changed significantly. Trim if it becomes longer than ~7 sentences.",
      },
    },
    required: ["overall_summary", "main_themes"],
  },
};

export const summaryToolDefinition = {
  type: "function",
  function: summaryFunctionDefinition,
} as const;

export interface SummaryResponseBody {
  week: string;
  summary: {
    overall_summary: string;
    main_themes: string[];
    ideas?: string;
    dreams?: string;
    life?: string;
    gratitude?: string;
    complaints?: string;
    questions?: string;
    answers?: string;
    context?: string;
  };
}

