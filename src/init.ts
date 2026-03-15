import { mkdirSync, existsSync, copyFileSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { detectLanguage } from './session.ts';

const LEARNCODE_DIR = '.learncode';

// Fallback embedded content for when skill files aren't found (dev mode)
const FALLBACK_SKILL_CONTENT = `---
skill: learncode
description: "Learning-aware coding assistant that adapts to your skill level"
---

# LearnCode Skill

This skill enables Claude to act as a learning-aware coding assistant.
It monitors your coding patterns and provides contextual help based on your activity.

## Usage
- \`/learn\` - Start a learning session
- \`/hint\` - Get a contextual hint
- \`/explain\` - Explain a concept
- \`/review\` - Review recent changes
`;

const FALLBACK_COMMANDS: Record<string, string> = {
  'learn.md': `---
command: learn
description: "Start or manage a learning session"
---

# /learn

Start a learning session with learncode. This will:
1. Detect your project language
2. Start the file watcher
3. Begin tracking your coding patterns
4. Provide adaptive assistance based on your activity

Usage: \`/learn [start|stop|status]\`
`,
  'hint.md': `---
command: hint
description: "Get a contextual hint based on current activity"
---

# /hint

Get a contextual hint based on what you're currently working on.
LearnCode analyzes your recent file changes and coding patterns
to provide relevant suggestions without giving away the full solution.

Usage: \`/hint [topic]\`
`,
  'explain.md': `---
command: explain
description: "Explain a programming concept in context"
---

# /explain

Get an explanation of a programming concept, tailored to your current
project and skill level. LearnCode uses your session context to provide
relevant examples from your own code.

Usage: \`/explain [concept]\`
`,
  'review.md': `---
command: review
description: "Review recent code changes with learning feedback"
---

# /review

Review your recent code changes with learning-focused feedback.
LearnCode analyzes your diffs and provides:
- What you did well
- Areas for improvement
- Concepts to explore further

Usage: \`/review\`
`,
  'auto-review.md': `---
command: auto-review
description: "Automated periodic review triggered by cron"
---

# /auto-review

Automated periodic review designed to run on a cron schedule (e.g., every 1 minute via \`/loop\`).
Checks for recent changes and only intervenes when meaningful — silence is the default.

This command is started automatically when you run \`/learn\`.
`,
};

const CLAUDE_MD_SECTION = `
## LearnCode Integration

LearnCode is available for learning-aware coding assistance.

Available commands:
- \`/learn\` - Start/stop/check learning sessions
- \`/hint\` - Get contextual hints based on current activity
- \`/explain\` - Get explanations tailored to your code
- \`/review\` - Review recent changes with learning feedback
- \`/auto-review\` - Cron-triggered review (started automatically by /learn)

LearnCode monitors your coding patterns and adapts its assistance level.
When a session is active, auto-review runs every minute but stays silent unless there's something worth commenting on.
`;

function getSkillDir(): string {
  try {
    const currentFile = new URL(import.meta.url).pathname;
    return join(dirname(currentFile), '..', 'skill');
  } catch {
    // Fallback for environments where import.meta.url doesn't resolve to a file path
    return join(process.cwd(), 'skill');
  }
}

function copyOrCreate(src: string, dest: string, fallbackContent: string): void {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  Copied: ${dest}`);
  } else {
    writeFileSync(dest, fallbackContent, 'utf-8');
    console.log(`  Created: ${dest} (from embedded content)`);
  }
}

export async function initProject(): Promise<void> {
  console.log('[learncode] Initializing project...\n');

  const skillDir = getSkillDir();

  // 1. Create .claude/skills/learncode/ directory
  const skillsDir = join('.claude', 'skills', 'learncode');
  if (!existsSync(skillsDir)) {
    mkdirSync(skillsDir, { recursive: true });
    console.log(`  Created directory: ${skillsDir}`);
  }

  // 2. Create .claude/commands/ directory
  const commandsDir = join('.claude', 'commands');
  if (!existsSync(commandsDir)) {
    mkdirSync(commandsDir, { recursive: true });
    console.log(`  Created directory: ${commandsDir}`);
  }

  // 3. Copy skill files
  console.log('\n[learncode] Setting up skill files...');

  // SKILL.md
  copyOrCreate(
    join(skillDir, 'SKILL.md'),
    join(skillsDir, 'SKILL.md'),
    FALLBACK_SKILL_CONTENT,
  );

  // Command files
  for (const [filename, fallback] of Object.entries(FALLBACK_COMMANDS)) {
    copyOrCreate(
      join(skillDir, 'commands', filename),
      join(commandsDir, filename),
      fallback,
    );
  }

  // 4. Append to .claude/CLAUDE.md
  console.log('\n[learncode] Updating CLAUDE.md...');
  const claudeMdPath = join('.claude', 'CLAUDE.md');

  if (existsSync(claudeMdPath)) {
    const existing = readFileSync(claudeMdPath, 'utf-8');
    if (!existing.includes('LearnCode Integration')) {
      appendFileSync(claudeMdPath, CLAUDE_MD_SECTION, 'utf-8');
      console.log('  Appended LearnCode section to existing CLAUDE.md');
    } else {
      console.log('  CLAUDE.md already has LearnCode section, skipping');
    }
  } else {
    const claudeDir = dirname(claudeMdPath);
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    writeFileSync(claudeMdPath, `# Project Configuration\n${CLAUDE_MD_SECTION}`, 'utf-8');
    console.log('  Created CLAUDE.md with LearnCode section');
  }

  // 5. Create .learncode/ directory for state storage
  console.log('\n[learncode] Setting up state directory...');
  if (!existsSync(LEARNCODE_DIR)) {
    mkdirSync(LEARNCODE_DIR, { recursive: true });
    console.log(`  Created directory: ${LEARNCODE_DIR}`);
  }

  const snapshotDir = join(LEARNCODE_DIR, 'snapshots');
  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true });
    console.log(`  Created directory: ${snapshotDir}`);
  }

  // 6. Detect language
  console.log('\n[learncode] Detecting project language...');
  const language = detectLanguage();
  console.log(`  Detected: ${language}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('[learncode] Initialization complete!\n');
  console.log('  Created:');
  console.log(`    ${skillsDir}/SKILL.md`);
  for (const filename of Object.keys(FALLBACK_COMMANDS)) {
    console.log(`    ${commandsDir}/${filename}`);
  }
  console.log(`    ${LEARNCODE_DIR}/`);
  console.log(`    ${LEARNCODE_DIR}/snapshots/`);
  console.log(`\n  Language: ${language}`);
  console.log('\n  Next steps:');
  console.log('    1. Run `learncode watch` to start the file watcher');
  console.log('    2. Use `/learn` in Claude Code to start a session');
  console.log('    3. Code as usual - LearnCode will adapt to your patterns');
  console.log('');
}
