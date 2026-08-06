import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui utility function — merges Tailwind classes cleanly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a number as percentage
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// Get color based on score
export function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";  // green
  if (score >= 60) return "#f59e0b";  // amber
  if (score >= 40) return "#f97316";  // orange
  return "#ef4444";                    // red
}

// Get score label
export function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Fit";
  if (score >= 40) return "Needs Work";
  return "Major Gaps";
}

// Format date to readable string
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}