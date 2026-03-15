# learncode

A Claude Code skill that turns Claude Code into a real-time programming tutor. It watches your code as you write, detects what you're struggling with, and coaches you — without giving away the answer.

## Quick Start

```bash
# In your project directory:
npx learncode init
```

This installs the learncode skill into your `.claude/` directory. Then in Claude Code:

```
/learn
```

That's it. Start writing code and Claude will coach you in real time.

## How It Works

learncode has two parts:

1. **A CLI helper** that watches your files, computes diffs, and detects behavioral patterns (struggling, going in circles, idle, etc.)
2. **A Claude Code skill** that reads the CLI's structured output and coaches you based on your assistance level

The CLI does the mechanical work so Claude gets concise, structured context without wasting tokens reading raw files.

## Commands

### CLI Commands

```bash
npx learncode init              # Install skill files into .claude/
npx learncode watch start       # Start the file watcher
npx learncode watch stop        # Stop the file watcher
npx learncode diff              # Show raw diff since last check
npx learncode diff --summary    # Structured JSON summary (what Claude reads)
npx learncode status            # Project info, detected language, tracked files
npx learncode history           # Timeline of your changes
npx learncode session save      # Save session state
npx learncode session load      # Restore session state
```

### Slash Commands (in Claude Code)

| Command | What it does |
|---------|-------------|
| `/learn` | Start a coaching session. Optionally set level: `/learn --assist hints` |
| `/hint` | Get a nudge toward the solution — never the answer itself |
| `/explain` | Explain what your current code does and why |
| `/review` | Teacher-style code review: what's good, what could improve |

## Assistance Levels

Set the level when starting a session with `/learn --assist <level>`:

| Level | Behavior |
|-------|----------|
| **hints** | Minimal. Asks leading questions. Never gives code. |
| **guide** | Explains concepts, suggests approaches, provides context. *(default)* |
| **pair** | Full collaboration. Shows code, explains everything. |

`/hint` always gives hints only, regardless of your assistance level.

## Pattern Detection

The watcher detects what you're doing and adjusts coaching automatically:

| Pattern | What it means | Claude's response |
|---------|--------------|-------------------|
| `rapid_edits` | Many saves in a short window | Offers help — you may be struggling |
| `undo_cycle` | Same lines changed and reverted | Hints at the concept you're stuck on |
| `idle` | No changes for a while | Checks in — are you stuck? |
| `new_concept` | First use of a new construct | Explains the concept proactively |
| `error_loop` | Same error keeps appearing | Targeted guidance on the error |
| `steady_progress` | Clean, consistent changes | Stays quiet, occasional encouragement |

## Supported Languages

Auto-detected from your project files:

Python, JavaScript, TypeScript, C#, Go, Rust, Java, and more.

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build for npm (targets Node so npx works without Bun)
bun run build

# Run locally during development
bun run src/cli.ts <command>
```

## Project Structure

```
src/
  cli.ts          # CLI entry point (cac commands)
  watcher.ts      # File watcher with debounce and snapshots
  differ.ts       # Diff computation and JSON summaries
  detector.ts     # Behavioral pattern detection
  session.ts      # Session state and language detection
  init.ts         # Skill scaffolding into .claude/
skill/
  SKILL.md        # Core coaching skill definition
  CLAUDE.md       # Template appended to user's CLAUDE.md
  commands/       # Slash command definitions
tests/            # bun:test test suites
```

## License

MIT
