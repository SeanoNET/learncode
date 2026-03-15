export type Pattern =
  | 'rapid_edits'
  | 'undo_cycle'
  | 'idle'
  | 'new_concept'
  | 'error_loop'
  | 'steady_progress';

export interface ChangeEvent {
  timestamp: number;
  file: string;
  linesChanged: number[];
  content: string;
  errors: string[];
}

const MAX_EVENTS = 100;
const eventHistory: ChangeEvent[] = [];

const CONCEPT_KEYWORDS = [
  'class ',
  'async ',
  'await ',
  'import ',
  'export ',
  'interface ',
  'type ',
  'enum ',
  'try',
  'catch',
  'extends ',
  'implements ',
  'abstract ',
  'yield ',
  'Promise',
  'Map(',
  'Set(',
  'WeakMap(',
  'generator',
  'decorator',
  'readonly ',
  'namespace ',
];

export function recordChange(event: ChangeEvent): void {
  eventHistory.push(event);

  // Keep only the last MAX_EVENTS
  if (eventHistory.length > MAX_EVENTS) {
    eventHistory.splice(0, eventHistory.length - MAX_EVENTS);
  }
}

export function getRecentEvents(windowMs: number = 5 * 60 * 1000): ChangeEvent[] {
  const cutoff = Date.now() - windowMs;
  return eventHistory.filter(e => e.timestamp >= cutoff);
}

function detectRapidEdits(events: ChangeEvent[]): boolean {
  if (events.length < 5) return false;

  // Check for >5 events within any 60-second window
  for (let i = 0; i <= events.length - 5; i++) {
    const windowStart = events[i]?.timestamp;
    if (windowStart === undefined) continue;

    let count = 0;
    for (let j = i; j < events.length; j++) {
      const evt = events[j];
      if (evt && evt.timestamp - windowStart <= 60_000) {
        count++;
      } else {
        break;
      }
    }

    if (count > 5) return true;
  }

  return false;
}

function detectUndoCycle(events: ChangeEvent[]): boolean {
  if (events.length < 3) return false;

  // Look at the last 3+ events for the same file with same lines being changed/reverted
  const recentByFile = new Map<string, ChangeEvent[]>();
  for (const event of events) {
    const fileEvents = recentByFile.get(event.file) ?? [];
    fileEvents.push(event);
    recentByFile.set(event.file, fileEvents);
  }

  for (const fileEvents of recentByFile.values()) {
    if (fileEvents.length < 3) continue;

    // Check if the same lines are being modified repeatedly in recent events
    const last3 = fileEvents.slice(-3);
    const e0 = last3[0];
    const e1 = last3[1];
    const e2 = last3[2];

    if (!e0 || !e1 || !e2) continue;

    // Same lines touched in all 3 events
    const lines0 = new Set(e0.linesChanged);
    const lines2 = new Set(e2.linesChanged);

    const overlap01 = e0.linesChanged.some(l => e1.linesChanged.includes(l));
    const overlap12 = e1.linesChanged.some(l => e2.linesChanged.includes(l));
    const overlap02 = [...lines0].some(l => lines2.has(l));

    if (overlap01 && overlap12 && overlap02) {
      return true;
    }
  }

  return false;
}

function detectIdle(events: ChangeEvent[]): boolean {
  if (events.length === 0) return true;

  const lastEvent = events[events.length - 1];
  if (!lastEvent) return true;

  const idleThreshold = 3 * 60 * 1000; // 3 minutes
  return (Date.now() - lastEvent.timestamp) > idleThreshold;
}

function detectNewConcept(events: ChangeEvent[]): boolean {
  if (events.length < 2) return false;

  const latest = events[events.length - 1];
  if (!latest) return false;

  // Get all previous content for this file
  const previousEvents = events
    .slice(0, -1)
    .filter(e => e.file === latest.file);

  const previousContent = previousEvents.map(e => e.content).join('\n');

  // Check if latest content contains concept keywords not present before
  for (const keyword of CONCEPT_KEYWORDS) {
    if (latest.content.includes(keyword) && !previousContent.includes(keyword)) {
      return true;
    }
  }

  return false;
}

function detectErrorLoop(events: ChangeEvent[]): boolean {
  if (events.length < 3) return false;

  // Check last 3+ events for the same error appearing repeatedly
  const recentWithErrors = events.filter(e => e.errors.length > 0).slice(-3);

  if (recentWithErrors.length < 3) return false;

  // Check if any error string appears in all recent error events
  const e0 = recentWithErrors[0];
  if (!e0) return false;

  for (const error of e0.errors) {
    const appearsInAll = recentWithErrors.every(e => e.errors.includes(error));
    if (appearsInAll) return true;
  }

  return false;
}

export function resetState(): void {
  eventHistory.length = 0;
}

export function detectPattern(events?: ChangeEvent[]): Pattern {
  const evts = events ?? getRecentEvents();
  // Check patterns in priority order

  // Idle check first (no recent activity)
  if (detectIdle(evts)) {
    return 'idle';
  }

  // Error loop (frustration indicator, high priority)
  if (detectErrorLoop(evts)) {
    return 'error_loop';
  }

  // Undo cycle (confusion indicator)
  if (detectUndoCycle(evts)) {
    return 'undo_cycle';
  }

  // Rapid edits (may indicate struggling or experimentation)
  if (detectRapidEdits(evts)) {
    return 'rapid_edits';
  }

  // New concept (learning moment)
  if (detectNewConcept(evts)) {
    return 'new_concept';
  }

  // Default: steady progress
  return 'steady_progress';
}
