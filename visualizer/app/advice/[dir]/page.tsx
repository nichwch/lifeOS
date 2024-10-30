"use client";

import { useState, useEffect } from "react";
import { generateAdvice, NIETZSCHE_BLURB } from "./Advice";

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
    const getPhilosopherAdvice = async () => {
      setLoading(true);
      const advice = await generateAdvice(summaries, NIETZSCHE_BLURB);
      setPhilosopherResponse(advice);
      setLoading(false);
    };
    if (summaries.length > 0) {
      getPhilosopherAdvice();
    }
  }, [summaries]);

  return (
    <>
      <div className="min-h-screen mx-auto w-full lg:w-[900px] p-6">
        {loading ? (
          <div className="text-center">
            <p className="text-lg italic">loading...</p>
          </div>
        ) : (
          philosopherResponse && (
            <div className="bg-gray-100 p-6 rounded-lg shadow-md">
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
