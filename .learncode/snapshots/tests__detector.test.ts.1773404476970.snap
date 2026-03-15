import { describe, it, expect, beforeEach } from 'bun:test';
import { detectPattern, recordChange, getRecentEvents, resetState, type ChangeEvent } from '../src/detector';

/**
 * Tests for the pattern detector module (src/detector.ts).
 *
 * The detector module maintains internal state (event history).
 * State is accumulated via recordChange() calls and queried via detectPattern()
 * and getRecentEvents(). If the module provides a reset/clear function, use it
 * in beforeEach. Otherwise, tests are designed to work with cumulative state
 * by using unique file names and controlling timestamps.
 *
 * NOTE: If state isolation between tests is needed and the module lacks a
 * reset function, consider adding a `resetState()` export to src/detector.ts.
 */

const makeEvent = (overrides: Partial<ChangeEvent> = {}): ChangeEvent => ({
  timestamp: Date.now(),
  file: 'test.py',
  linesChanged: [1, 2, 3],
  content: 'x = 1\ny = 2\n',
  errors: [],
  ...overrides,
});

describe('detector', () => {
  beforeEach(() => {
    resetState();
  });

  describe('rapid_edits pattern', () => {
    it('detects rapid_edits when >5 events occur within 60 seconds', () => {
      const now = Date.now();
      const file = 'rapid-test.py';

      // Record 6 events within a short time window
      for (let i = 0; i < 6; i++) {
        recordChange(makeEvent({
          timestamp: now + (i * 5000), // 5 seconds apart
          file,
          linesChanged: [i + 1],
          content: `x = ${i}\n`,
        }));
      }

      const pattern = detectPattern();
      expect(pattern).toBe('rapid_edits');
    });
  });

  describe('undo_cycle pattern', () => {
    it('detects undo_cycle when same lines are modified, reverted, modified again', () => {
      const now = Date.now();
      const file = 'undo-test.py';
      const sameLine = [5, 6, 7];

      // Original change
      recordChange(makeEvent({
        timestamp: now,
        file,
        linesChanged: sameLine,
        content: 'x = 1\n',
      }));

      // Revert (same lines changed back)
      recordChange(makeEvent({
        timestamp: now + 10000,
        file,
        linesChanged: sameLine,
        content: 'x = 0\n', // reverted
      }));

      // Same change again
      recordChange(makeEvent({
        timestamp: now + 20000,
        file,
        linesChanged: sameLine,
        content: 'x = 1\n', // back to original change
      }));

      const pattern = detectPattern();
      expect(pattern).toBe('undo_cycle');
    });
  });

  describe('error_loop pattern', () => {
    it('detects error_loop when same error appears >2 times consecutively', () => {
      const now = Date.now();
      const file = 'error-test.py';
      const repeatedError = 'TypeError: cannot read property of undefined';

      for (let i = 0; i < 3; i++) {
        recordChange(makeEvent({
          timestamp: now + (i * 10000),
          file,
          linesChanged: [1],
          content: `attempt ${i}\n`,
          errors: [repeatedError],
        }));
      }

      const pattern = detectPattern();
      expect(pattern).toBe('error_loop');
    });
  });

  describe('steady_progress pattern', () => {
    it('returns steady_progress for normal coding activity', () => {
      const now = Date.now();

      // Record a few normal changes spread out over time with different lines
      recordChange(makeEvent({
        timestamp: now,
        file: 'progress-test.py',
        linesChanged: [1, 2],
        content: 'def hello():\n    pass\n',
      }));

      recordChange(makeEvent({
        timestamp: now + 120000, // 2 minutes later
        file: 'progress-test.py',
        linesChanged: [10, 11, 12],
        content: 'def world():\n    return 42\n',
      }));

      const pattern = detectPattern();
      expect(pattern).toBe('steady_progress');
    });
  });

  describe('new_concept pattern', () => {
    it('detects new_concept when content contains a class definition for the first time', () => {
      const now = Date.now();

      // First event: simple code without class keyword
      recordChange(makeEvent({
        timestamp: now,
        file: 'concept-test.py',
        linesChanged: [1, 2],
        content: 'x = 1\ny = 2\n',
      }));

      // Second event: introduces 'class' keyword for the first time
      recordChange(makeEvent({
        timestamp: now + 30000,
        file: 'concept-test.py',
        linesChanged: [1, 2, 3, 4, 5],
        content: 'class MyNewClass:\n    def __init__(self):\n        self.value = 0\n',
      }));

      const pattern = detectPattern();
      expect(pattern).toBe('new_concept');
    });
  });

  describe('idle pattern', () => {
    it('detects idle when last event was >3 minutes ago', () => {
      const now = Date.now();

      // Record an event that happened well over 3 minutes ago
      recordChange(makeEvent({
        timestamp: now - (4 * 60 * 1000), // 4 minutes ago
        file: 'idle-test.py',
        linesChanged: [1],
        content: 'x = 1\n',
      }));

      const pattern = detectPattern();
      expect(pattern).toBe('idle');
    });
  });

  describe('event history management', () => {
    it('caps event history at 100 events', () => {
      const now = Date.now();

      // Record 110 events
      for (let i = 0; i < 110; i++) {
        recordChange(makeEvent({
          timestamp: now + (i * 1000),
          file: `history-cap-${i}.py`,
          linesChanged: [1],
          content: `v${i}\n`,
        }));
      }

      // getRecentEvents with a very large time window should return at most 100
      const events = getRecentEvents(now + 200000);
      expect(events.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecentEvents', () => {
    it('respects time window parameter', () => {
      const now = Date.now();

      // Record events at different times
      recordChange(makeEvent({
        timestamp: now - 120000, // 2 minutes ago
        file: 'recent-old.py',
        linesChanged: [1],
        content: 'old\n',
      }));

      recordChange(makeEvent({
        timestamp: now - 30000, // 30 seconds ago
        file: 'recent-new.py',
        linesChanged: [1],
        content: 'new\n',
      }));

      // Get events from last 60 seconds only
      const recentEvents = getRecentEvents(60000);

      // Should include the 30-second-old event but not the 2-minute-old one
      const files = recentEvents.map(e => e.file);
      expect(files).toContain('recent-new.py');
      expect(files).not.toContain('recent-old.py');
    });
  });
});
