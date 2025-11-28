"use client";

import { useState } from "react";
import { ApiKeyModal } from "./ApiKeyModal";
import { useApiKey } from "./ApiKeyProvider";

export const AppNavbar = () => {
  const { apiKey, isReady } = useApiKey();
  const [open, setOpen] = useState(false);

  const label = apiKey ? "Update API key" : "API key required";
  const buttonClasses = apiKey
    ? "bg-green-100 hover:bg-green-300 text-green-900"
    : "bg-yellow-100 hover:bg-yellow-200 text-red-700 animate-pulse";

  return (
    <>
      <nav className="fixed z-[99998] top-0 w-full border-b border-black bg-orange-50/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto max-w-[900px] flex items-center justify-between px-4 py-2 text-sm">
          <span className="font-semibold tracking-wide uppercase">
            LifeOS summarizer
          </span>
          <button
            disabled={!isReady}
            onClick={() => setOpen(true)}
            className={`border border-black px-3 py-1 ${buttonClasses} disabled:opacity-60`}
          >
            {label}
          </button>
        </div>
      </nav>
      <ApiKeyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

