"use client";

import { useEffect, useState } from "react";
import { useApiKey } from "./ApiKeyProvider";

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export const ApiKeyModal = ({ open, onClose }: ApiKeyModalProps) => {
  const { apiKey, setApiKey, isReady } = useApiKey();
  const [keyValue, setKeyValue] = useState("");

  useEffect(() => {
    if (open) {
      setKeyValue(apiKey ?? "");
    }
  }, [open, apiKey]);

  if (!open || !isReady) return null;

  const handleSave = () => {
    const trimmed = keyValue.trim();
    setApiKey(trimmed.length ? trimmed : null);
    onClose();
  };

  const handleClear = () => {
    setApiKey(null);
    setKeyValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-orange-100 border-2 border-black shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-2">OpenRouter API key</h2>
        <p className="text-sm text-gray-700">
          Generate a personal key on{" "}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="underline text-blue-700"
          >
            OpenRouter&apos;s API key page
          </a>
          . Your key stays in this browser&apos;s local storage and is attached
          to every summarization request.
        </p>
        <label className="flex flex-col text-sm gap-2">
          <span>Paste your OpenRouter API key</span>
          <input
            type="password"
            value={keyValue}
            onChange={(event) => setKeyValue(event.target.value)}
            placeholder="sk-or-v1-..."
            className="border border-black px-3 py-2 bg-white"
          />
        </label>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={handleClear}
            className="border border-black bg-red-200 hover:bg-red-300 px-3 py-1 text-sm"
          >
            Clear key
          </button>
          <button
            onClick={handleSave}
            className="border border-black bg-green-200 hover:bg-green-300 px-3 py-1 text-sm"
          >
            Save key
          </button>
          <button
            onClick={onClose}
            className="border border-black bg-gray-200 hover:bg-gray-300 px-3 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

