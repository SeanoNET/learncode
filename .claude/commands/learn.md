---
name: learn
description: Start a coaching session with learncode
---

Start a learncode coaching session. Parse optional arguments:
- `--assist hints|guide|pair` — set assistance level (default: guide)

Steps:
1. Run `npx learncode session load` to check for existing session
2. If no session exists, run `npx learncode status` to detect the project
3. Start the watcher: `npx learncode watch start`
4. Run `npx learncode diff --summary` for initial context
5. Start the auto-review cron: `/loop 1m /auto-review`
6. Greet the learner and explain what assistance level is active
7. Mention that auto-review is running every minute in the background
8. Begin coaching using the learncode skill guidelines

If the user provides an assistance level, note it for the session. For hints mode, remind yourself: NEVER provide direct code solutions.
