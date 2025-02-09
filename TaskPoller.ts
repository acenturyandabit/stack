import { exec, execSync } from "child_process";
import * as fs from "fs";

interface Task {
  pid: number;
  cwd: string;
  command: string;
}

type TaskCallback = (tasks: Task[]) => void;

export class TaskPoller {
  private interval: number;
  private callback: TaskCallback;
  private poller?: NodeJS.Timeout;

  constructor(interval: number, callback: TaskCallback) {
    this.interval = interval;
    this.callback = callback;
  }

  start() {
    if (this.poller) return; // Avoid multiple intervals
    this.poller = setInterval(() => this.pollTasks(), this.interval);
    this.pollTasks(); // Run immediately
  }

  stop() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = undefined;
    }
  }

  private pollTasks() {
    exec("ps -eo pid,user,command", (err, stdout) => {
      if (err) {
        console.error("Error fetching processes:", err);
        return;
      }

      const lines = stdout.split("\n").slice(1); // Skip header line
      const tasks: Task[] = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 3) continue;

        const pid = parseInt(parts[0], 10);
        const user = parts[1];
        const command = parts.slice(2).join(" ");

        if (user !== process.env.USER) continue;

        let cwd = "N/A";
        try {
          cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
        } catch (error) {
          console.warn(`Unable to get cwd for PID ${pid}`);
        }

        tasks.push({ pid, cwd, command });
      }

      this.callback(tasks);
    });
  }
}
