---
name: hint
description: Get a hint without the answer
---

The learner is stuck and wants a nudge — NOT the answer.

Steps:
1. Run `npx learncode diff --summary` to understand current state
2. Identify what the learner is trying to do based on recent changes
3. Provide a hint that guides them toward the solution:
   - Ask a leading question about the problematic area
   - Point to the specific line number where the issue is
   - Mention a relevant concept without showing the implementation
   - Suggest what to search for or look up

**CRITICAL**: Even in pair mode, /hint always gives hints only, never solutions. This is the learner explicitly asking for a nudge.
