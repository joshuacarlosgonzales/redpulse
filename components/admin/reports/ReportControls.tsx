// components/admin/reports/ReportControls.tsx
"use client";

import { LucideIcon, Download, Printer, RefreshCw } from "lucide-react";

// --- Page header with functional Refresh / Export / Print buttons ----------

interface ReportHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onRefresh: () => void;
  onExport: () => void;
  refreshing?: boolean;
  showPrint?: boolean;
}

export function ReportHeader({
  icon: Icon,
  title,
  subtitle,
  onRefresh,
  onExport,
  refreshing = false,
  showPrint = false,
}: ReportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <Icon className="w-8 h-8 text-red-500" />
          {title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl transition text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        {showPrint && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        )}
      </div>
    </div>
  );
}

// --- Sub tab bar -------------------------------------------------------------

export interface SubTabDef<T extends string> {
  key: T;
  label: string;
  icon: LucideIcon;
}

interface SubTabBarProps<T extends string> {
  tabs: SubTabDef<T>[];
  active: T;
  onChange: (tab: T) => void;
}

export function SubTabBar<T extends string>({ tabs, active, onChange }: SubTabBarProps<T>) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 print:hidden">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            active === key
              ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// --- Stat card -----------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  hintColor?: "emerald" | "yellow" | "red" | "blue" | "zinc";
  valueColor?: "default" | "emerald" | "yellow" | "red" | "blue";
}

const HINT_COLORS: Record<string, string> = {
  emerald: "text-emerald-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  blue: "text-blue-600",
  zinc: "text-zinc-500",
};

const VALUE_COLORS: Record<string, string> = {
  default: "text-zinc-900 dark:text-white",
  emerald: "text-emerald-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  blue: "text-blue-600",
};

export function StatCard({ label, value, hint, hintColor = "zinc", valueColor = "default" }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${VALUE_COLORS[valueColor]}`}>{value}</p>
      {hint && <p className={`text-xs ${HINT_COLORS[hintColor]}`}>{hint}</p>}
    </div>
  );
}

// --- Empty state ---------------------------------------------------------------

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}