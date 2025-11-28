"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "lifeos_openrouter_api_key";

interface ApiKeyContextValue {
  apiKey: string | null;
  setApiKey: (value: string | null) => void;
  isReady: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextValue | undefined>(undefined);

export const ApiKeyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
    setIsReady(true);
  }, []);

  const setApiKey = useCallback((value: string | null) => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
      setApiKeyState(value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setApiKeyState(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      apiKey,
      setApiKey,
      isReady,
    }),
    [apiKey, isReady, setApiKey]
  );

  return (
    <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
};

export const API_KEY_STORAGE_KEY = STORAGE_KEY;

