"use client";

import { useState, useEffect } from "react";

const COUNSELORS = [
  "Nietzsche",
  "Milan Kundera",
  "Dostoevsky",
  "John Steinbeck",
];

interface AdviceResponse {
  philosopher: string;
  overall_advice: string;
  relevant_quotes: string[];
  praise: string;
  criticism: string;
}

export default function Home({ params }: { params: { dir: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [advice, setAdvice] = useState<AdviceResponse[]>([]);

  useEffect(() => {
    const fetchSavedAdvice = async () => {
      try {
        const encodedDirectory = encodeURIComponent("~/" + params.dir);
        const response = await fetch(
          `http://127.0.0.1:5000/get_advice?directory=${encodedDirectory}`
        );
        const data = await response.json();
        if (!response.ok) {
          console.log("No saved advice found");
          setAdvice([]);
          return;
        }
        setAdvice(data);
      } catch (error) {
        console.error("Error fetching advice:", error);
        setAdvice([]);
      }
    };
    fetchSavedAdvice();
  }, [params.dir]);
  console.log("advice", advice);

  const handleGenerateAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/generate_advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          directory: "~/" + params.dir,
          philosophers: COUNSELORS,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setAdvice(data);
      }
    } catch (error) {
      console.error("Error generating advice:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen mx-auto w-full lg:w-[900px] mb-10">
      <div className="shadow-md fixed z-[99999] top-0 h-[40px] w-full lg:w-[900px] bg-orange-200 border border-black p-2">
        <div className="flex items-center justify-between">
          <span className="">advice generator</span>
          <button
            onClick={handleGenerateAdvice}
            className="bg-green-100 hover:bg-green-300 disabled:bg-green-100 border border-green-600 text-green-600 px-1 text-sm"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate New Advice"}
          </button>
        </div>
      </div>

      {advice.length > 0 ? (
        <div className="space-y-6 mt-10">
          {advice.map((item: AdviceResponse, index) => (
            <div
              key={index}
              className="bg-orange-200 p-6 shadow-md border border-black"
            >
              <h3 className="font-bold mb-2">{item.philosopher}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Advice:</h4>
                  <p className="text-lg italic">{item.overall_advice}</p>
                </div>
                <div>
                  <h4 className="font-semibold ">Relevant Quotes:</h4>
                  <ul className="list-disc pl-5 ">
                    {item.relevant_quotes.map((quote, i) => (
                      <li key={i} className="text-lg italic">
                        {quote}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold ">Praise:</h4>
                  <p className="text-lg italic ">{item.praise}</p>
                </div>
                <div>
                  <h4 className="font-semibold ">Criticism:</h4>
                  <p className="text-lg italic ">{item.criticism}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic mt-10">
          No advice found. Generate some!
        </p>
      )}
    </div>
  );
}
