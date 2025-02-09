import { Task } from "./types";
import { Express } from "express";

type TaskCallback = (tasks: Record<string, Task>) => void;

export default class HTTPTaskPoller {
  private interval: number;
  private callback: TaskCallback;
  private poller?: NodeJS.Timeout;
  private tasks: Record<string, Task> = {};

  constructor(interval: number, callback: TaskCallback, app: Express) {
    this.interval = interval;
    this.callback = callback;
    app.post("/status", (req, res) => {
      const pid = req.query.thread_id as string;
      this.tasks[pid] = {
        pid,
        cwd: "-",
        command: req.query.thread_id as string,
        started_at: Date.now(), // use as last seen
        completed_at: null
      };
      this.callback(this.tasks);
    });
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

  acknowledge(task_id: string) {
    delete this.tasks[task_id];
    this.callback(this.tasks);
  }

  private pollTasks() {
    const oldTaskString = JSON.stringify(this.tasks);
    this.tasks = Object.fromEntries(Object.entries(this.tasks).map(([_, task]) => {
      if (task.started_at < Date.now() - 4000 && task.completed_at === null) {
        task.completed_at = Date.now();
        console.log("completed!")
      }
      return [_, {...task}];
    }));
    if (oldTaskString != JSON.stringify(this.tasks)) {
      console.log("emitted")
      this.callback(this.tasks);
    }
  }
}