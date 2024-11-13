import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function directoryFromParams(params: string[] | string) {
  return Array.isArray(params) ? params.join("/") : params;
}
