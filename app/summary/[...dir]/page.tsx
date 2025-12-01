"use client";

import { useCallback, useMemo, useState } from "react";
import { useApiKey } from "@/components/ApiKeyProvider";
import { SummaryResponseBody } from "@/lib/summarize";
import {
  formatWeekKey,
  parseDateFromFilename,
  sortWeekKeys,
  weekKeyToTimestamp,
  weekNeedsSummary,
} from "@/lib/weeks";

type SummaryFields = SummaryResponseBody["summary"] & {
  [key: string]: string | string[] | undefined;
};

interface WeeklySummary {
  week: string;
  timestamp: number;
  summary: SummaryFields;
  files: string[];
}

interface WeekFileEntry {
  name: string;
  handle: FileSystemFileHandle;
}

type WeekFileMap = Record<string, WeekFileEntry[]>;

const SUMMARY_FILENAME = "weekly_summaries.json";

const formatWeekDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const ensureDirectoryPermission = async (
  handle: FileSystemDirectoryHandle
) => {
  if (handle.queryPermission) {
    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") return true;
    if (handle.requestPermission) {
      const status = await handle.requestPermission({ mode: "readwrite" });
      return status === "granted";
    }
  }
  return true;
};

const readSummariesFile = async (
  handle: FileSystemDirectoryHandle
): Promise<WeeklySummary[]> => {
  try {
    const fileHandle = await handle.getFileHandle(SUMMARY_FILENAME);
    const file = await fileHandle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed as WeeklySummary[];
    }
    return [];
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "NotFoundError" || error.name === "NotAllowedError")
    ) {
      return [];
    }
    console.error("Failed to read summaries file", error);
    return [];
  }
};

const writeSummariesFile = async (
  handle: FileSystemDirectoryHandle,
  summaries: WeeklySummary[]
) => {
  const fileHandle = await handle.getFileHandle(SUMMARY_FILENAME, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(summaries, null, 2));
  await writable.close();
};

const collectWeeklyFileMap = async (
  directoryHandle: FileSystemDirectoryHandle
): Promise<WeekFileMap> => {
  const map: WeekFileMap = {};

  for await (const [name, entry] of directoryHandle.entries()) {
    if (entry.kind !== "file") continue;
    if (name === SUMMARY_FILENAME || name.startsWith(".")) continue;
    const parsedDate = parseDateFromFilename(name);
    if (!parsedDate) continue;
    const weekKey = formatWeekKey(parsedDate);
    const fileHandle = entry as FileSystemFileHandle;
    map[weekKey] = [...(map[weekKey] ?? []), { name, handle: fileHandle }];
  }

  return map;
};

const buildWeeklyNoteText = async (files: WeekFileEntry[]) => {
  let output = "";
  for (const file of files) {
    const noteFile = await file.handle.getFile();
    const content = await noteFile.text();
    output += `#### ${file.name}\n\n${content}\n\n`;
  }
  return output.trim();
};

export default function SummaryPage() {
  const { apiKey } = useApiKey();
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState<string>("");
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [weekFiles, setWeekFiles] = useState<WeekFileMap>({});
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fsSupported =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  const unsummarizedWeeks = useMemo(() => {
    const pending = Object.keys(weekFiles).filter((week) =>
      weekNeedsSummary(
        week,
        weekFiles[week].map((file) => file.name),
        summaries
      )
    );
    return sortWeekKeys(pending).map((week) => ({
      week,
      files: weekFiles[week],
    }));
  }, [weekFiles, summaries]);

  const unsummarizedCount = useMemo(
    () => unsummarizedWeeks.reduce((total, entry) => total + entry.files.length, 0),
    [unsummarizedWeeks]
  );

  const selectDirectory = useCallback(async () => {
    if (!fsSupported) return;
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      setIsLoadingDirectory(true);
      const picker = (window as Window & {
        showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker;
      if (!picker) {
        setErrorMessage("Your browser cannot open directories.");
        return;
      }
      const handle = await picker();
      const permitted = await ensureDirectoryPermission(handle);
      if (!permitted) {
        setErrorMessage("Permission to read this directory was denied.");
        return;
      }
      setDirectoryHandle(handle);
      setDirectoryName(handle.name);
      const [existingSummaries, fileMap] = await Promise.all([
        readSummariesFile(handle),
        collectWeeklyFileMap(handle),
      ]);
      setSummaries(existingSummaries);
      setWeekFiles(fileMap);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to select directory", error);
      setErrorMessage("Failed to open the selected directory.");
    } finally {
      setIsLoadingDirectory(false);
    }
  }, [fsSupported]);

  const refreshDirectoryState = useCallback(async () => {
    if (!directoryHandle) return;
    const [existingSummaries, fileMap] = await Promise.all([
      readSummariesFile(directoryHandle),
      collectWeeklyFileMap(directoryHandle),
    ]);
    setSummaries(existingSummaries);
    setWeekFiles(fileMap);
  }, [directoryHandle]);

  const handleSummarize = useCallback(async () => {
    if (!directoryHandle) {
      setErrorMessage("Please select your notes directory first.");
      return;
    }
    if (!apiKey) {
      setErrorMessage("Add your OpenRouter API key to summarize notes.");
      return;
    }
    if (unsummarizedWeeks.length === 0) {
      setStatusMessage("All caught up!");
      return;
    }

    setIsSummarizing(true);
    setErrorMessage(null);
    setStatusMessage("Summarizing new notes...");

    let nextSummaries = [...summaries];
    let context = nextSummaries.at(-1)?.summary?.context ?? "";

    try {
      for (const { week, files } of unsummarizedWeeks) {
        setStatusMessage(`Summarizing week starting ${week}...`);
        const notes = await buildWeeklyNoteText(files);
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-openrouter-api-key": apiKey,
          },
          body: JSON.stringify({ week, notes, context }),
        });

        if (!response.ok) {
          const details = await response.json().catch(() => null);
          throw new Error(details?.error ?? "Summarization failed");
        }

        const data = (await response.json()) as SummaryResponseBody;
        context = data.summary.context ?? context;
        const timestamp = weekKeyToTimestamp(week);
        const fileNames = files.map((file) => file.name);
        const newEntry: WeeklySummary = {
          week,
          timestamp,
          summary: data.summary,
          files: fileNames,
        };

        const existingIndex = nextSummaries.findIndex((entry) => entry.week === week);
        if (existingIndex >= 0) {
          nextSummaries[existingIndex] = newEntry;
        } else {
          nextSummaries = [...nextSummaries, newEntry];
        }

        nextSummaries.sort((a, b) => a.timestamp - b.timestamp);
        await writeSummariesFile(directoryHandle, nextSummaries);
        setSummaries(nextSummaries);
      }
      setStatusMessage("Summaries updated!");
      await refreshDirectoryState();
    } catch (error) {
      console.error("Failed to summarize notes", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to summarize notes."
      );
    } finally {
      setIsSummarizing(false);
    }
  }, [apiKey, directoryHandle, refreshDirectoryState, summaries, unsummarizedWeeks]);

  if (!fsSupported) {
    return (
      <div className="mx-auto w-full max-w-[900px] py-10">
        <p className="text-red-700 bg-red-100 border border-red-700 p-4">
          Your browser doesn&apos;t support the File System Access API. Please use
          a Chromium-based browser (Chrome, Edge, Arc, etc.) to summarize local
          notes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto w-full max-w-[900px] space-y-6">
      <div className="sticky top-16 z-[99997] bg-orange-200 border border-black shadow-md p-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="space-y-1">
            <span className="font-semibold uppercase tracking-wide block text-sm">
              Summarizer
            </span>
            {directoryName ? (
              <span className="text-xs uppercase text-gray-700">
                Directory: {directoryName}
              </span>
            ) : (
              <span className="text-xs text-gray-700">
                Pick a notes directory to get started.
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectDirectory}
              className="border border-black bg-white px-3 py-1 text-sm hover:bg-orange-100 disabled:opacity-60"
              disabled={isLoadingDirectory}
            >
              {isLoadingDirectory ? "Opening..." : "Select directory"}
            </button>
            <button
              onClick={handleSummarize}
              disabled={
                isSummarizing || !directoryHandle || !apiKey || unsummarizedCount === 0
              }
              className="border border-black bg-green-200 hover:bg-green-300 px-3 py-1 text-sm disabled:opacity-60"
            >
              {isSummarizing ? "Summarizing..." : "Summarize new notes"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
          <span className="bg-blue-100 border border-blue-600 text-blue-700 px-2 py-0.5">
            {unsummarizedCount} unsummarized notes
          </span>
          {!apiKey && (
            <span className="text-red-700">
              Add your API key from the navbar to enable summarization.
            </span>
          )}
          {statusMessage && <span className="text-gray-700">{statusMessage}</span>}
        </div>
        {errorMessage && (
          <p className="mt-2 text-sm text-red-700 bg-red-100 border border-red-400 px-2 py-1">
            {errorMessage}
          </p>
        )}
      </div>

      {summaries
        .slice()
        .reverse()
        .map((summary) => (
          <div key={summary.week} className="mb-6 mt-4 bg-orange-200 shadow-md">
            <h2 className="sticky top-28 p-2 border border-black bg-orange-200 shadow-md z-[10]">
              Week of{" "}
              <span className="underline">{formatWeekDate(summary.timestamp)}</span>
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
                        className={`w-[250px] h-[250px] border overflow-y-auto border-black shadow-md relative ${bgColor}`}
                      >
                        <h1
                          className={`text-lg mb-2 border-b border-b-black sticky top-0 px-2 ${bgColor}`}
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
  );
}
