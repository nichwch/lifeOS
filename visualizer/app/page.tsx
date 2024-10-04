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

  useEffect(() => {
    fetch("http://127.0.0.1:5000/weekly_summaries")
      .then((response) => response.json())
      .then((data) => setSummaries(data));
  }, []);

  const formatWeekDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <>
      <div className="min-h-screen mx-auto w-full lg:w-[900px]">
        <div className="fixed z-[99999] top-0 h-[30px] bg-orange-200 border border-black px-2">
          summarizer
        </div>
        {summaries
          .slice()
          .reverse()
          .map((summary) => (
            <div
              key={summary.week}
              className="mb-6 mt-10 bg-orange-200 relative shadow-md"
            >
              <h2
                className={`sticky z-50 top-[30px] px-2 border border-black bg-orange-200 shadow-md`}
              >
                Week of{" "}
                <span className="underline">
                  {formatWeekDate(summary.timestamp)}
                </span>
              </h2>
              <div className="whitespace-pre-wrap flex border-x border-x-black border-b border-b-black">
                {summary.summary.overall_summary && (
                  <div className="basis-1/3 shrink-0 border-r border-r-black p-2">
                    <div>{summary.summary.overall_summary}</div>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 p-3 bg-orange-300/30 shadow-inner grow">
                  {Object.entries(summary.summary).map(([key, value]) => {
                    const bgColor =
                      key === "dreams"
                        ? "bg-purple-100"
                        : key === "life"
                        ? "bg-green-100"
                        : key === "ideas"
                        ? "bg-blue-100"
                        : key === "gratitude"
                        ? "bg-pink-200"
                        : key === "complaints"
                        ? "bg-red-300"
                        : null;
                    if (
                      key !== "overall_summary" &&
                      key !== "main_themes" &&
                      key !== "context" &&
                      value
                    ) {
                      return (
                        <div
                          key={key}
                          className={`w-[250px] h-[250px] border 
                          overflow-y-auto border-black 
                          shadow-md
                          relative 
                          ${bgColor}`}
                        >
                          <h1
                            className={`text-lg mb-2 border-b
                             border-b-black sticky top-0
                             px-2
                         ${bgColor} 
                          `}
                          >
                            {key}
                          </h1>
                          <div className="px-2">{value}</div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
