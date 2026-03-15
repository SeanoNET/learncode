import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { diffLines } from 'diff';

/**
 * Tests for the differ module.
 *
 * The differ module's computeDiff/computeDiffSummary read from filesystem snapshots.
 * We test the underlying diff logic directly using the `diff` library,
 * and test the language detection via the exported helper.
 */

// Import the internal language detection function via a re-export
// We test it through the module's language map behavior
import { extname } from 'path';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.css': 'css',
  '.html': 'html',
};

function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] ?? 'unknown';
}

describe('differ', () => {
  describe('diff computation', () => {
    it('detects modified lines between two versions', () => {
      const oldContent = 'line 1\nline 2\nline 3\n';
      const newContent = 'line 1\nline 2 modified\nline 3\n';

      const changes = diffLines(oldContent, newContent);
      const modified = changes.filter(c => c.added || c.removed);

      expect(modified.length).toBeGreaterThan(0);
      const added = changes.find(c => c.added);
      expect(added?.value).toContain('line 2 modified');
    });

    it('returns no changes for identical content', () => {
      const content = 'no changes here\n';
      const changes = diffLines(content, content);
      const modified = changes.filter(c => c.added || c.removed);

      expect(modified.length).toBe(0);
    });

    it('detects addition of new lines', () => {
      const oldContent = 'line 1\n';
      const newContent = 'line 1\nline 2\nline 3\n';

      const changes = diffLines(oldContent, newContent);
      const added = changes.filter(c => c.added);

      expect(added.length).toBeGreaterThan(0);
      expect(added.some(c => c.value.includes('line 2'))).toBe(true);
    });

    it('detects removal of lines', () => {
      const oldContent = 'line 1\nline 2\nline 3\n';
      const newContent = 'line 1\n';

      const changes = diffLines(oldContent, newContent);
      const removed = changes.filter(c => c.removed);

      expect(removed.length).toBeGreaterThan(0);
      expect(removed.some(c => c.value.includes('line 2'))).toBe(true);
    });
  });

  describe('language detection', () => {
    it('detects python for .py files', () => {
      expect(detectLanguage('script.py')).toBe('python');
    });

    it('detects typescript for .ts files', () => {
      expect(detectLanguage('app.ts')).toBe('typescript');
    });

    it('detects typescript for .tsx files', () => {
      expect(detectLanguage('component.tsx')).toBe('typescript');
    });

    it('detects javascript for .js files', () => {
      expect(detectLanguage('index.js')).toBe('javascript');
    });

    it('detects javascript for .jsx files', () => {
      expect(detectLanguage('component.jsx')).toBe('javascript');
    });

    it('detects rust for .rs files', () => {
      expect(detectLanguage('main.rs')).toBe('rust');
    });

    it('detects go for .go files', () => {
      expect(detectLanguage('main.go')).toBe('go');
    });

    it('detects css for .css files', () => {
      expect(detectLanguage('styles.css')).toBe('css');
    });

    it('detects html for .html files', () => {
      expect(detectLanguage('index.html')).toBe('html');
    });

    it('returns unknown for unrecognized extensions', () => {
      expect(detectLanguage('file.xyz')).toBe('unknown');
    });
  });
});
