import { watch, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, basename, relative, extname } from 'path';

const LEARNCODE_DIR = '.learncode';
const SNAPSHOT_DIR = join(LEARNCODE_DIR, 'snapshots');
const PID_FILE = join(LEARNCODE_DIR, 'watcher.pid');
const IGNORED = ['node_modules', '.git', '.learncode', 'dist', '.claude'];
const MAX_SNAPSHOTS = 50;
const DEBOUNCE_MS = 300;

const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.cs',
  '.c', '.cpp', '.h', '.hpp',
  '.html', '.css', '.scss', '.sass', '.less',
  '.json', '.yaml', '.yml', '.toml',
  '.md', '.txt', '.sh', '.bash',
  '.sql', '.graphql', '.gql',
  '.svelte', '.vue', '.astro',
];

const changeTimestamps: Map<string, number[]> = new Map();
const debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

function ensureDirs(): void {
  if (!existsSync(LEARNCODE_DIR)) {
    mkdirSync(LEARNCODE_DIR, { recursive: true });
  }
  if (!existsSync(SNAPSHOT_DIR)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function isIgnored(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.some(part => IGNORED.includes(part));
}

function isCodeFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return CODE_EXTENSIONS.includes(ext);
}

function snapshotKey(filePath: string): string {
  return filePath.replace(/[/\\]/g, '__');
}

function takeSnapshot(filePath: string): void {
  try {
    if (!existsSync(filePath) || !statSync(filePath).isFile()) return;

    const content = readFileSync(filePath, 'utf-8');
    const key = snapshotKey(filePath);
    const timestamp = Date.now();
    const snapFile = join(SNAPSHOT_DIR, `${key}.${timestamp}.snap`);

    writeFileSync(snapFile, content, 'utf-8');
    pruneSnapshots(key);
  } catch {
    // File may have been deleted between check and read
  }
}

function pruneSnapshots(key: string): void {
  const prefix = `${key}.`;
  const snapFiles = readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith('.snap'))
    .sort();

  while (snapFiles.length > MAX_SNAPSHOTS) {
    const oldest = snapFiles.shift();
    if (oldest) {
      try {
        unlinkSync(join(SNAPSHOT_DIR, oldest));
      } catch {
        // Already deleted
      }
    }
  }
}

function getSnapshotFiles(filePath: string): string[] {
  const key = snapshotKey(filePath);
  const prefix = `${key}.`;

  if (!existsSync(SNAPSHOT_DIR)) return [];

  return readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith('.snap'))
    .sort();
}

export function getLatestSnapshot(filePath: string): string | null {
  const files = getSnapshotFiles(filePath);
  if (files.length === 0) return null;

  const latest = files[files.length - 1];
  if (!latest) return null;

  try {
    return readFileSync(join(SNAPSHOT_DIR, latest), 'utf-8');
  } catch {
    return null;
  }
}

export function getPreviousSnapshot(filePath: string): string | null {
  const files = getSnapshotFiles(filePath);
  if (files.length < 2) return null;

  const previous = files[files.length - 2];
  if (!previous) return null;

  try {
    return readFileSync(join(SNAPSHOT_DIR, previous), 'utf-8');
  } catch {
    return null;
  }
}

export function getTrackedFiles(dir: string = '.'): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORED.includes(entry)) continue;

      const fullPath = join(currentDir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile() && isCodeFile(fullPath)) {
          files.push(relative('.', fullPath));
        }
      } catch {
        // Skip inaccessible files
      }
    }
  }

  walk(dir);
  return files;
}

export function isWatcherRunning(): boolean {
  if (!existsSync(PID_FILE)) return false;

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
    process.kill(pid, 0); // Signal 0 tests if process exists
    return true;
  } catch {
    // Process not running or PID invalid
    return false;
  }
}

export function getChangeTimestamps(): Map<string, number[]> {
  return new Map(changeTimestamps);
}

export function startWatcher(): void {
  ensureDirs();

  if (isWatcherRunning()) {
    console.log('[learncode] Watcher is already running.');
    return;
  }

  // Write PID file
  writeFileSync(PID_FILE, String(process.pid), 'utf-8');
  console.log(`[learncode] Watcher started (PID: ${process.pid})`);

  // Take initial snapshots of all tracked files
  const trackedFiles = getTrackedFiles();
  console.log(`[learncode] Taking initial snapshots of ${trackedFiles.length} files...`);
  for (const file of trackedFiles) {
    takeSnapshot(file);
  }

  // Start recursive file watcher
  const watcher = watch('.', { recursive: true }, (_eventType, filename) => {
    if (!filename) return;

    const filePath = filename.toString();

    if (isIgnored(filePath) || !isCodeFile(filePath)) return;

    // Clear existing debounce timer for this file
    const existing = debounceTimers.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      debounceTimers.delete(filePath);

      // Record change timestamp
      const timestamps = changeTimestamps.get(filePath) ?? [];
      timestamps.push(Date.now());
      // Keep last 100 timestamps per file
      if (timestamps.length > 100) {
        timestamps.splice(0, timestamps.length - 100);
      }
      changeTimestamps.set(filePath, timestamps);

      // Take snapshot
      takeSnapshot(filePath);
      console.log(`[learncode] Snapshot saved: ${filePath}`);
    }, DEBOUNCE_MS);

    debounceTimers.set(filePath, timer);
  });

  // Handle process cleanup
  const cleanup = (): void => {
    watcher.close();
    try {
      if (existsSync(PID_FILE)) {
        unlinkSync(PID_FILE);
      }
    } catch {
      // Best effort cleanup
    }
    console.log('[learncode] Watcher stopped.');
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  console.log('[learncode] Watching for file changes...');
}

export function stopWatcher(): void {
  if (!existsSync(PID_FILE)) {
    console.log('[learncode] No watcher is running (no PID file found).');
    return;
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
    process.kill(pid, 'SIGTERM');
    console.log(`[learncode] Watcher stopped (PID: ${pid})`);
  } catch (err) {
    console.log(`[learncode] Could not stop watcher: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    unlinkSync(PID_FILE);
  } catch {
    // PID file already removed
  }
}
