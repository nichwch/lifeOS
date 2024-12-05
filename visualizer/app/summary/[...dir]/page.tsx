"use client";

import { useState, useEffect } from "react";
import { directoryFromParams } from "../../../lib/utils";

export interface WeeklySummary {
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
  const [unsummarizedCount, setUnsummarizedCount] = useState<number | null>(
    null
  );
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.dir]);

  const fetchData = async () => {
    // Handle both array and string cases for directory path
    const directory = directoryFromParams(params.dir);
    const encodedDirectory = encodeURIComponent("~/" + directory);
    try {
      // Fetch summaries
      const summariesResponse = await fetch(
        `http://127.0.0.1:5000/weekly_summaries?directory=${encodedDirectory}`
      );
      const summariesData = await summariesResponse.json();
      setSummaries(summariesData);

      // Fetch unsummarized count
      const countResponse = await fetch(
        `http://127.0.0.1:5000/unsummarized_count?directory=${encodedDirectory}`
      );
      const countData = await countResponse.json();
      setUnsummarizedCount(countData.unsummarized_count);
    } catch (error) {
      console.error("Error fetching data:", error);
      setUnsummarizedCount(Infinity);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const directory = directoryFromParams(params.dir);
      const encodedDirectory = encodeURIComponent("~/" + directory);
      const response = await fetch(
        `http://127.0.0.1:5000/summarize?directory=${encodedDirectory}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        await fetchData(); // Refresh data after summarization
      } else {
        console.error("Error summarizing notes");
      }
    } catch (error) {
      console.error("Error summarizing notes:", error);
    }
    setIsSummarizing(false);
  };

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
        <div className="fixed z-[99999] top-0 h-[40px] w-full lg:w-[900px] bg-orange-200 border border-black p-2">
          <div className="flex items-center justify-between">
            <span>summarizer</span>
            <div className="flex items-center space-x-2">
              {unsummarizedCount !== null && (
                <span className="bg-blue-100 border border-blue-600 text-blue-600 px-1 text-sm">
                  {unsummarizedCount} unsummarized notes
                </span>
              )}
              {unsummarizedCount !== null && unsummarizedCount > 0 && (
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="bg-green-100 hover:bg-green-300 disabled:bg-green-100 border border-green-600 text-green-600 px-1 text-sm"
                >
                  {isSummarizing ? "summarizing..." : "summarize new notes"}
                </button>
              )}
            </div>
          </div>
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
                className={`sticky z-50 top-[40px] p-2 border border-black bg-orange-200 shadow-md`}
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
                        : "bg-gray-200";
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
