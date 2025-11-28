import { SummaryResponseBody } from "./summarize";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

const monthIndex = (token: string) =>
  MONTHS.findIndex((month) => month === token.toLowerCase().slice(0, 3));

const buildDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month, day));
  // Ensure the date is valid (e.g., rule out Feb 30)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month) {
    return null;
  }
  return date;
};

export const parseDateFromFilename = (filename: string): Date | null => {
  const [basename] = filename.split(".");
  const tokens = basename.trim().split(/\s+/);

  if (tokens.length === 4) {
    // Format: Mon Nov 25 2024
    const [, monthToken, dayToken, yearToken] = tokens;
    const month = monthIndex(monthToken);
    if (month === -1) return null;
    const day = parseInt(dayToken, 10);
    const year = parseInt(yearToken, 10);
    if (Number.isNaN(day) || Number.isNaN(year)) return null;
    return buildDate(year, month, day);
  }

  if (tokens.length === 3) {
    // Format: Nov 25 2024
    const [monthToken, dayToken, yearToken] = tokens;
    const month = monthIndex(monthToken);
    if (month === -1) return null;
    const day = parseInt(dayToken, 10);
    const year = parseInt(yearToken, 10);
    if (Number.isNaN(day) || Number.isNaN(year)) return null;
    return buildDate(year, month, day);
  }

  return null;
};

export const startOfWeek = (date: Date): Date => {
  const clone = new Date(date);
  // Convert to Monday as start of week
  const day = clone.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7;
  clone.setUTCDate(clone.getUTCDate() - diff);
  clone.setUTCHours(0, 0, 0, 0);
  return clone;
};

export const formatWeekKey = (date: Date): string => {
  const start = startOfWeek(date);
  return start.toISOString().slice(0, 10);
};

export const weekKeyToTimestamp = (weekKey: string): number => {
  const date = new Date(`${weekKey}T00:00:00Z`);
  return Math.floor(date.getTime() / 1000);
};

interface StoredSummaryMetadata {
  week: string;
  files?: string[];
}

const normalizeFilenames = (names: string[]) =>
  names
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .join("::");

export const weekNeedsSummary = (
  week: string,
  filenames: string[],
  summaries: StoredSummaryMetadata[]
) => {
  const existing = summaries.find((entry) => entry.week === week);
  if (!existing) return true;
  const existingNames = normalizeFilenames(existing.files ?? []);
  const currentNames = normalizeFilenames(filenames);
  return existingNames !== currentNames;
};

export const sortWeekKeys = (weeks: string[]) =>
  weeks.sort(
    (a, b) => new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()
  );

export type StoredWeeklySummary = SummaryResponseBody["summary"] & {
  [key: string]: string | string[] | undefined;
};

