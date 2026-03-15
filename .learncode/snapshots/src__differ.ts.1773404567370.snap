import { diffLines } from 'diff';
import { getLatestSnapshot, getPreviousSnapshot, getTrackedFiles } from './watcher.ts';
import { detectPattern, getRecentEvents } from './detector.ts';
import { getSession } from './session.ts';
import type { Pattern } from './detector.ts';
import type { Session } from './session.ts';
import { extname } from 'path';

export interface Change {
  type: 'added' | 'modified' | 'removed';
  lines: string;
  summary: string;
}

export interface FileDiff {
  file: string;
  language: string;
  changes: Change[];
  errors: string[];
}

export interface DiffSummary {
  timestamp: string;
  files: FileDiff[];
  pattern: string;
  session: {
    duration: string;
    changes_count: number;
    topics_covered: string[];
  };
}

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.cs': 'csharp',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.svelte': 'svelte',
  '.vue': 'vue',
  '.astro': 'astro',
  '.sh': 'shell',
  '.bash': 'shell',
};

function detectLanguageFromExt(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] ?? 'unknown';
}

function computeDuration(session: Session | null): string {
  if (!session) return '0m';

  const start = new Date(session.startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

function summarizeChange(changeType: 'added' | 'modified' | 'removed', lines: string): string {
  const lineCount = lines.split('\n').filter(l => l.trim()).length;
  switch (changeType) {
    case 'added':
      return `Added ${lineCount} line${lineCount === 1 ? '' : 's'}`;
    case 'removed':
      return `Removed ${lineCount} line${lineCount === 1 ? '' : 's'}`;
    case 'modified':
      return `Modified ${lineCount} line${lineCount === 1 ? '' : 's'}`;
  }
}

export function computeDiff(): string {
  const trackedFiles = getTrackedFiles();
  const diffParts: string[] = [];

  for (const file of trackedFiles) {
    const latest = getLatestSnapshot(file);
    const previous = getPreviousSnapshot(file);

    if (latest === null) continue;
    if (previous === null) continue;
    if (latest === previous) continue;

    const changes = diffLines(previous, latest);
    const lines: string[] = [];

    lines.push(`--- a/${file}`);
    lines.push(`+++ b/${file}`);

    for (const change of changes) {
      const prefix = change.added ? '+' : change.removed ? '-' : ' ';
      const changeLines = change.value.split('\n');

      for (const line of changeLines) {
        if (line || changeLines.length === 1) {
          lines.push(`${prefix}${line}`);
        }
      }
    }

    if (lines.length > 2) {
      diffParts.push(lines.join('\n'));
    }
  }

  return diffParts.join('\n\n');
}

export function computeDiffSummary(): DiffSummary {
  const trackedFiles = getTrackedFiles();
  const fileDiffs: FileDiff[] = [];

  for (const file of trackedFiles) {
    const latest = getLatestSnapshot(file);
    const previous = getPreviousSnapshot(file);

    if (latest === null) continue;
    if (previous === null && latest !== null) {
      // New file - all content is added
      fileDiffs.push({
        file,
        language: detectLanguageFromExt(file),
        changes: [{
          type: 'added',
          lines: latest,
          summary: summarizeChange('added', latest),
        }],
        errors: [],
      });
      continue;
    }

    if (previous === null) continue;
    if (latest === previous) continue;

    const changes = diffLines(previous, latest);
    const fileChanges: Change[] = [];

    for (const change of changes) {
      if (change.added) {
        fileChanges.push({
          type: 'added',
          lines: change.value,
          summary: summarizeChange('added', change.value),
        });
      } else if (change.removed) {
        fileChanges.push({
          type: 'removed',
          lines: change.value,
          summary: summarizeChange('removed', change.value),
        });
      }
    }

    if (fileChanges.length > 0) {
      fileDiffs.push({
        file,
        language: detectLanguageFromExt(file),
        changes: fileChanges,
        errors: [],
      });
    }
  }

  const recentEvents = getRecentEvents();
  const pattern: Pattern = detectPattern(recentEvents);
  const session = getSession();

  return {
    timestamp: new Date().toISOString(),
    files: fileDiffs,
    pattern,
    session: {
      duration: computeDuration(session),
      changes_count: session?.changesCount ?? fileDiffs.length,
      topics_covered: session?.topicsCovered ?? [],
    },
  };
}
