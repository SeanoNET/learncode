---
name: auto-review
description: Automated periodic review triggered by cron — checks for changes and reviews if needed
---

This command is designed to run on a cron schedule (e.g., every 1 minute via `/loop`). It should be lightweight and only intervene when there's something meaningful to say.

Steps:
1. Run `npx learncode diff --summary` to check for recent changes
2. **If no changes** (empty files array or `pattern` is `idle`): Do nothing. Do NOT output any text. Stay completely silent.
3. **If changes exist**, evaluate whether coaching is warranted:
   - `rapid_edits` or `error_loop` or `undo_cycle` → Always intervene with pattern-appropriate coaching
   - `new_concept` → Briefly explain the new concept
   - `steady_progress` with fewer than 3 changed files → Stay silent, let them work
   - `steady_progress` with 3+ changed files → Give a brief, encouraging check-in or mini-review
4. If intervening, keep it **very short** (2-3 sentences max). This is a background check-in, not a full review.
5. **Always** end every tick (silent or not) with a brief reminder line:
   `💡 Remember: /hint, /explain, /review, /learn are available anytime.`
   This is the only output when staying silent.
6. Run `npx learncode session save` after any intervention

Important:
- **Silence is the default.** Most cron ticks should produce no output.
- Only speak up when the learner would genuinely benefit from a nudge.
- Never repeat advice you've already given (check session history).
- Respect the current assistance level from the session.
