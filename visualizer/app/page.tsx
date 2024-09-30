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

export default function Home() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("http://127.0.0.1:5000/weekly_summaries")
      .then((response) => response.json())
      .then((data) => setSummaries(data));
  }, []);

  const toggleWeek = (week: string) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(week)) {
        newSet.delete(week);
      } else {
        newSet.add(week);
      }
      return newSet;
    });
  };

  const formatWeekDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return `Week of ${date.toLocaleDateString("en-US", options)}`;
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Weekly Summaries</h1>
      {summaries
        .slice()
        .reverse()
        .map((summary) => (
          <div key={summary.week} className="mb-6 border rounded-lg p-4">
            <h2
              className="text-xl font-semibold mb-2 cursor-pointer"
              onClick={() => toggleWeek(summary.week)}
            >
              {formatWeekDate(summary.timestamp)}
              {expandedWeeks.has(summary.week) ? " v" : " ^"}
            </h2>
            {expandedWeeks.has(summary.week) && (
              <div className="whitespace-pre-wrap flex flex-wrap gap-4">
                {summary.summary.overall_summary && (
                  <div className="w-1/4 border border-black p-2">
                    <h1 className="text-lg mb-2">overall</h1>
                    <div>{summary.summary.overall_summary}</div>
                  </div>
                )}
                {summary.summary.ideas && (
                  <div className="w-1/4 border border-black p-2">
                    <h1 className="text-lg mb-2">ideas</h1>
                    <div>{summary.summary.ideas}</div>
                  </div>
                )}
                {summary.summary.dreams && (
                  <div className="w-1/4 border border-black p-2">
                    <h1 className="text-lg mb-2">dreams</h1>
                    <div>{summary.summary.dreams}</div>
                  </div>
                )}
                {summary.summary.life && (
                  <div className="w-1/4 border border-black p-2">
                    <h1 className="text-lg mb-2">life</h1>
                    <div>{summary.summary.life}</div>
                  </div>
                )}
                {summary.summary.complaints && (
                  <div className="w-1/4 border border-black p-2">
                    <h1 className="text-lg mb-2">complaints</h1>
                    <div>{summary.summary.complaints}</div>
                  </div>
                )}
                {summary.summary.gratitude && (
                  <div className="w-1/4 border border-black p-2">
                    <h1 className="text-lg mb-2">gratitude</h1>
                    <div>{summary.summary.gratitude}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
