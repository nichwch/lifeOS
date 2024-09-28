"use client";

import { useState, useEffect } from "react";

interface WeeklySummary {
  week: string;
  timestamp: number;
  summary: string;
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
      {summaries.map((summary) => (
        <div key={summary.week} className="mb-6 border rounded-lg p-4">
          <h2
            className="text-xl font-semibold mb-2 cursor-pointer"
            onClick={() => toggleWeek(summary.week)}
          >
            {formatWeekDate(summary.timestamp)}
            {expandedWeeks.has(summary.week) ? " 🔽" : " 🔼"}
          </h2>
          {expandedWeeks.has(summary.week) && (
            <div className="whitespace-pre-wrap">{summary.summary}</div>
          )}
        </div>
      ))}
    </div>
  );
}
