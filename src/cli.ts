#!/usr/bin/env node
import cac from "cac";
import { startWatcher, stopWatcher } from "./watcher";
import { computeDiff, computeDiffSummary } from "./differ";
import { getStatus, getHistory } from "./session";
import { saveSession, loadSession } from "./session";
import { initProject } from "./init";

const cli = cac("learncode");
//test
cli
  .command("init", "Scaffold learncode skill into your project")
  .action(async () => {
    await initProject();
  });

cli
  .command("watch [action]", "File watcher (start|stop)")
  .action(async (action: string | undefined) => {
    if (action === "start") {
      await startWatcher();
    } else if (action === "stop") {
      await stopWatcher();
    } else {
      console.log("Usage: learncode watch <start|stop>");
    }
  });

cli
  .command("diff", "Show diff since last check")
  .option("--summary", "Output structured JSON summary")
  .action(async (options: { summary?: boolean }) => {
    if (options.summary) {
      const summary = await computeDiffSummary();
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const diff = await computeDiff();
      console.log(diff);
    }
  });

cli
  .command("status", "Show project info and tracked files")
  .action(async () => {
    const status = await getStatus();
    console.log(JSON.stringify(status, null, 2));
  });

cli.command("history", "Show timeline of changes").action(async () => {
  const history = await getHistory();
  console.log(JSON.stringify(history, null, 2));
});

cli
  .command("session [action]", "Session management (save|load)")
  .action(async (action: string | undefined) => {
    if (action === "save") {
      await saveSession();
      console.log("Session saved.");
    } else if (action === "load") {
      await loadSession();
      console.log("Session loaded.");
    } else {
      console.log("Usage: learncode session <save|load>");
    }
  });

cli.command("help", "See for help").action(async (action: String) => {
  console.log("This is the help command.");
});
cli.help();
cli.version("0.1.0");
cli.parse();
