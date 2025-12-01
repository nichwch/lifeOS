"use client";

import { ReactNode } from "react";
import { ApiKeyProvider } from "./ApiKeyProvider";

export const Providers = ({ children }: { children: ReactNode }) => {
  return <ApiKeyProvider>{children}</ApiKeyProvider>;
};

