import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { isWatcherRunning, getTrackedFiles } from './watcher.ts';

const LEARNCODE_DIR = '.learncode';
const SESSION_FILE = join(LEARNCODE_DIR, 'session.json');
const HISTORY_FILE = join(LEARNCODE_DIR, 'history.json');

export interface Session {
  id: string;
  startedAt: string;
  lastActivity: string;
  assistLevel: 'hints' | 'guide' | 'pair';
  language: string;
  filesTracked: string[];
  changesCount: number;
  topicsCovered: string[];
  conceptsExplained: string[];
}

function ensureDir(): void {
  if (!existsSync(LEARNCODE_DIR)) {
    mkdirSync(LEARNCODE_DIR, { recursive: true });
  }
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function detectLanguage(dir: string = '.'): string {
  const extensionCounts: Record<string, number> = {};

  // Check for specific indicator files
  if (existsSync(join(dir, 'package.json'))) {
    // Check if it's TypeScript
    if (existsSync(join(dir, 'tsconfig.json'))) {
      return 'typescript';
    }
    return 'javascript';
  }
  if (existsSync(join(dir, 'Cargo.toml'))) return 'rust';
  if (existsSync(join(dir, 'go.mod'))) return 'go';
  if (existsSync(join(dir, 'requirements.txt')) || existsSync(join(dir, 'setup.py')) || existsSync(join(dir, 'pyproject.toml'))) return 'python';
  if (existsSync(join(dir, 'pom.xml')) || existsSync(join(dir, 'build.gradle'))) return 'java';

  // Scan for file extensions
  const languageMap: Record<string, string> = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.cpp': 'cpp',
    '.c': 'c',
  };

  function scanDir(currentDir: string, depth: number = 0): void {
    if (depth > 3) return;

    let entries: string[];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (['node_modules', '.git', '.learncode', 'dist', '.claude'].includes(entry)) continue;

      const fullPath = join(currentDir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (stat.isFile()) {
          const ext = extname(entry).toLowerCase();
          const lang = languageMap[ext];
          if (lang) {
            extensionCounts[lang] = (extensionCounts[lang] ?? 0) + 1;
          }
        }
      } catch {
        // Skip inaccessible
      }
    }
  }

  scanDir(dir);

  // Return the most common language
  let maxCount = 0;
  let detectedLang = 'unknown';
  for (const [lang, count] of Object.entries(extensionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

export function startSession(assistLevel?: string): Session {
  ensureDir();

  const level = (['hints', 'guide', 'pair'].includes(assistLevel ?? '') ? assistLevel : 'guide') as Session['assistLevel'];
  const language = detectLanguage();
  const filesTracked = getTrackedFiles();

  const session: Session = {
    id: generateId(),
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    assistLevel: level,
    language,
    filesTracked,
    changesCount: 0,
    topicsCovered: [],
    conceptsExplained: [],
  };

  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf-8');
  console.log(`[learncode] Session started: ${session.id}`);
  console.log(`[learncode] Language: ${language}`);
  console.log(`[learncode] Assist level: ${level}`);
  console.log(`[learncode] Files tracked: ${filesTracked.length}`);

  return session;
}

export function getSession(): Session | null {
  if (!existsSync(SESSION_FILE)) return null;

  try {
    const data = readFileSync(SESSION_FILE, 'utf-8');
    return JSON.parse(data) as Session;
  } catch {
    return null;
  }
}

export function updateSession(updates: Partial<Session>): void {
  const session = getSession();
  if (!session) {
    console.log('[learncode] No active session. Start one with startSession().');
    return;
  }

  const updated: Session = {
    ...session,
    ...updates,
    lastActivity: new Date().toISOString(),
  };

  ensureDir();
  writeFileSync(SESSION_FILE, JSON.stringify(updated, null, 2), 'utf-8');
}

export function saveSession(): void {
  if (!existsSync(SESSION_FILE)) {
    console.log('[learncode] No active session to save.');
    return;
  }
  console.log('[learncode] Session file is persisted at:', SESSION_FILE);
}

export function loadSession(): void {
  const session = getSession();
  if (!session) {
    console.log('[learncode] No active session found.');
    return;
  }

  console.log('[learncode] Current session:');
  console.log(`  ID: ${session.id}`);
  console.log(`  Started: ${session.startedAt}`);
  console.log(`  Last activity: ${session.lastActivity}`);
  console.log(`  Assist level: ${session.assistLevel}`);
  console.log(`  Language: ${session.language}`);
  console.log(`  Files tracked: ${session.filesTracked.length}`);
  console.log(`  Changes: ${session.changesCount}`);
  console.log(`  Topics: ${session.topicsCovered.join(', ') || 'none yet'}`);
}

export function getStatus(): object {
  const session = getSession();
  const language = detectLanguage();
  const filesTracked = getTrackedFiles();
  const watcherRunning = isWatcherRunning();

  return {
    hasSession: session !== null,
    sessionId: session?.id ?? null,
    language,
    filesTracked: filesTracked.length,
    watcherRunning,
    assistLevel: session?.assistLevel ?? null,
    changesCount: session?.changesCount ?? 0,
    startedAt: session?.startedAt ?? null,
    lastActivity: session?.lastActivity ?? null,
  };
}

export function getHistory(): object[] {
  if (!existsSync(HISTORY_FILE)) return [];

  try {
    const data = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data) as object[];
  } catch {
    return [];
  }
}

export function recordHistory(entry: object): void {
  ensureDir();

  const history = getHistory();
  history.push({
    ...entry,
    recordedAt: new Date().toISOString(),
  });

  // Keep last 500 history entries
  const trimmed = history.slice(-500);
  writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}
