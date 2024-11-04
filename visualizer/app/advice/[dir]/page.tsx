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
    <div className="min-h-screen mx-auto w-full lg:w-[900px] p-6">
      <button
        onClick={handleGenerateAdvice}
        className="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate New Advice"}
      </button>

      {advice.length > 0 ? (
        <div className="space-y-6">
          {advice.map((item: AdviceResponse, index) => (
            <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md">
              <h3 className="font-bold mb-2">{item.philosopher}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Advice:</h4>
                  <p className="text-lg italic">{item.overall_advice}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Relevant Quotes:</h4>
                  <ul className="list-disc pl-5">
                    {item.relevant_quotes.map((quote, i) => (
                      <li key={i} className="text-lg italic">
                        {quote}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Praise:</h4>
                  <p className="text-lg italic">{item.praise}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Criticism:</h4>
                  <p className="text-lg italic">{item.criticism}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">No advice found. Generate some!</p>
      )}
    </div>
  );
}
