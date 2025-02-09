import { Task } from "./types";
import { Express } from "express";

type TaskCallback = (tasks: Record<string, Task>) => void;

type HTTPPollerTask = {
  name: string,
  last_seen: number,
  completed_at: number | null,
  ttl: number
}

export default class HTTPTaskPoller {
  private interval: number;
  private callback: TaskCallback;
  private poller?: NodeJS.Timeout;
  private innerTasks: Record<string, HTTPPollerTask> = {};

  constructor(interval: number, callback: TaskCallback, app: Express) {
    this.interval = interval;
    this.callback = callback;
    app.post("/status", (req, res) => {
      const name = req.query.thread_id as string;
      this.innerTasks[name] = {
        name,
        last_seen: Date.now(), // use as last seen
        completed_at: null,
        ttl: parseInt(req.query.ttl as string || "4000")
      };
      this.callback(this.tasks());
    });
  }

  tasks() {
    return Object.fromEntries(Object.entries(this.innerTasks).map(([_, task])=>{
      return [_, {
        pid: task.name,
        cwd: "-",
        command: task.name,
        started_at: task.last_seen,
        completed_at: task.completed_at
      }]
    })) as Record<string, Task>
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
    delete this.innerTasks[task_id];
    this.callback(this.tasks());
  }

  private pollTasks() {
    const oldTaskString = JSON.stringify(this.innerTasks);
    this.innerTasks = Object.fromEntries(Object.entries(this.innerTasks).map(([_, task]) => {
      if (task.last_seen < Date.now() - task.ttl && task.completed_at === null) {
        task.completed_at = Date.now();
      }
      return [_, {...task}];
    }));
    if (oldTaskString != JSON.stringify(this.innerTasks)) {
      console.log("emitted")
      this.callback(this.tasks());
    }
  }
}