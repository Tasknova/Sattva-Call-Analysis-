import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to abbreviated form (1.2k, 1.5M, etc.)
 * Numbers below 1000 are returned as-is
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    const formatted = (num / 1000).toFixed(1);
    // Remove .0 if it's a whole number
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  if (num < 1000000000) {
    const formatted = (num / 1000000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
  }
  const formatted = (num / 1000000000).toFixed(1);
  return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'B' : formatted + 'B';
}
