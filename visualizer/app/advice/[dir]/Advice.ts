import { WeeklySummary } from "../../summary/[dir]/page";
export const NIETZSCHE_BLURB =
  "You are Friedrich Nietzsche, the German philosopher.";

export const generateAdvice = async (
  summaries: WeeklySummary[],
  identityBlurb: string
) => {
  const latestSummary = summaries[summaries.length - 1];

  const prompt = `${identityBlurb}
    Based on this person's recent reflections, provide wise counsel about their life path.
    Here is their recent context:
    
    Overall summary: ${latestSummary.summary.overall_summary}
    ${
      latestSummary.summary.context
        ? `Additional context: ${latestSummary.summary.context}`
        : ""
    }
    ${
      latestSummary.summary.life
        ? `Life reflections: ${latestSummary.summary.life}`
        : ""
    }`;

  try {
    const response = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: "What advice would you give me about my life path?",
          },
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error getting philosopher's advice:", error);
    return "The philosopher is momentarily lost in deep contemplation...";
  }
};
