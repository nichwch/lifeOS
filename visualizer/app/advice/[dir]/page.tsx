"use client";

import { useState, useEffect } from "react";

interface WeeklySummary {
  week: string;
  timestamp: number;
  summary: {
    main_themes: string[];
    overall_summary: string;
    ideas?: string;
    dreams?: string;
    life?: string;
    gratitude?: string;
    complaints?: string;
    context?: string;
  };
}

export default function Home({ params }: { params: { dir: string } }) {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [philosopherResponse, setPhilosopherResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [params.dir]);

  const fetchData = async () => {
    try {
      const encodedDirectory = encodeURIComponent("~/" + params.dir);

      // Fetch summaries
      const summariesResponse = await fetch(
        `http://127.0.0.1:5000/weekly_summaries?directory=${encodedDirectory}`
      );
      const summariesData = await summariesResponse.json();
      setSummaries(summariesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (summaries.length > 0) {
      getPhilosopherAdvice();
    }
  }, [summaries]);

  const getPhilosopherAdvice = async () => {
    setLoading(true);
    const latestSummary = summaries[summaries.length - 1];

    const prompt = `You are Marcus Aurelius, the ancient Stoic philosopher and Roman Emperor. 
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
      setPhilosopherResponse(data.choices[0].message.content);
    } catch (error) {
      console.error("Error getting philosopher's advice:", error);
      setPhilosopherResponse(
        "The philosopher is momentarily lost in deep contemplation..."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen mx-auto w-full lg:w-[900px] p-6">
        {loading ? (
          <div className="text-center">
            <p className="text-lg italic">
              Marcus Aurelius is contemplating your situation...
            </p>
          </div>
        ) : (
          philosopherResponse && (
            <div className="bg-gray-100 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-serif mb-4">
                Marcus Aurelius speaks:
              </h2>
              <blockquote className="text-lg italic">
                {philosopherResponse}
              </blockquote>
            </div>
          )
        )}
      </div>
    </>
  );
}
