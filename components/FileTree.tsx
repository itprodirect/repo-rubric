"use client";

import { useMemo } from "react";

interface TreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

interface FileTreeProps {
  files: TreeNode[];
  selected: Set<string>;
  preselected: string[];
  reasons: Record<string, string>;
  filter: string;
  onToggle: (path: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";

  // Config files
  if (["json", "yaml", "yml", "toml", "ini"].includes(ext)) return "gear";
  // Documentation
  if (["md", "txt", "rst"].includes(ext)) return "doc";
  // JavaScript/TypeScript
  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)) return "code";
  // Python
  if (["py", "pyi"].includes(ext)) return "code";
  // Other code
  if (["go", "rs", "java", "kt", "cs", "rb", "php"].includes(ext)) return "code";
  // Special files
  if (path.includes("Dockerfile") || path.includes("docker-compose")) return "docker";
  if (path.endsWith(".prisma")) return "db";

  return "file";
}

function FileIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    gear: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    doc: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    code: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    docker: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.186.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186h-2.119a.185.185 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z"/>
      </svg>
    ),
    db: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    file: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };

  return icons[type] || icons.file;
}

interface FileRowProps {
  file: TreeNode;
  checked: boolean;
  isPreselected: boolean;
  reason?: string;
  onToggle: () => void;
}

function FileRow({ file, checked, isPreselected, reason, onToggle }: FileRowProps) {
  const iconType = getFileIcon(file.path);

  return (
    <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
      />
      <span className="text-gray-500 dark:text-gray-400">
        <FileIcon type={iconType} />
      </span>
      <span className={`flex-1 text-sm truncate ${
        isPreselected
          ? "font-medium text-gray-900 dark:text-white"
          : "text-gray-700 dark:text-gray-300"
      }`}>
        {file.path}
      </span>
      {reason && (
        <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {reason}
        </span>
      )}
      {file.size !== undefined && file.size > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {formatBytes(file.size)}
        </span>
      )}
    </label>
  );
}

export function FileTree({
  files,
  selected,
  preselected,
  reasons,
  filter,
  onToggle
}: FileTreeProps) {
  // Filter to only blobs (files) and apply search filter
  const filtered = useMemo(() => {
    const normalizedFilter = filter.toLowerCase();
    return files
      .filter((f) =>
        f.type === "blob" &&
        f.path.toLowerCase().includes(normalizedFilter)
      )
      .sort((a, b) => {
        // Sort: preselected first, then alphabetically
        const aPreselected = preselected.includes(a.path);
        const bPreselected = preselected.includes(b.path);
        if (aPreselected && !bPreselected) return -1;
        if (!aPreselected && bPreselected) return 1;
        return a.path.localeCompare(b.path);
      });
  }, [files, filter, preselected]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        {filter ? "No files match your filter" : "No files found"}
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {filtered.map((file) => (
        <FileRow
          key={file.path}
          file={file}
          checked={selected.has(file.path)}
          isPreselected={preselected.includes(file.path)}
          reason={reasons[file.path]}
          onToggle={() => onToggle(file.path)}
        />
      ))}
    </div>
  );
}

interface SelectionSummaryProps {
  count: number;
  estimatedChars: number;
  caps: {
    maxFiles: number;
    maxChars: number;
    maxPerFile: number;
  };
}

export function SelectionSummary({ count, estimatedChars, caps }: SelectionSummaryProps) {
  const overFileLimit = count > caps.maxFiles;
  const overCharLimit = estimatedChars > caps.maxChars;
  const hasWarning = overFileLimit || overCharLimit;

  return (
    <div className={`rounded-lg p-4 ${
      hasWarning
        ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className={overFileLimit ? "text-amber-700 dark:text-amber-400 font-medium" : "text-gray-700 dark:text-gray-300"}>
          <span className="font-bold">{count}</span> / {caps.maxFiles} files
          {overFileLimit && " (over limit)"}
        </div>
        <div className={overCharLimit ? "text-amber-700 dark:text-amber-400 font-medium" : "text-gray-700 dark:text-gray-300"}>
          <span className="font-bold">{(estimatedChars / 1000).toFixed(0)}k</span> / {caps.maxChars / 1000}k chars
          {overCharLimit && " (over limit)"}
        </div>
      </div>
      {hasWarning && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Exceeding limits may cause analysis truncation. Consider removing some files.
        </p>
      )}
    </div>
  );
}
