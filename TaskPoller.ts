import { exec } from "child_process";
import parser from 'any-date-parser';
import { Task } from "./types";
import fs from 'fs';

type TaskCallback = (tasks: Record<string, Task>) => void;

export default class TaskPoller {
  private interval: number;
  private callback: TaskCallback;
  private poller?: NodeJS.Timeout;
  private lastTasks: Record<string, Task> = {};

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

  acknowledge(task_id: string) {
    delete this.lastTasks[task_id];
    this.callback(this.lastTasks);
  }

  private pollTasks() {
    exec(`ps -u ${process.env.USER} -o ppid,pid,lstart,command`, (err, stdout) => {
      if (err) {
        console.error("Error fetching processes:", err);
        return;
      }

      const lines = stdout.split("\n").slice(1); // Skip header line
      type TaskFromPSCommand = {
        pid: string,
        ppid: string,
        startDate: number,
        command: string,
        cwd: string
      }

      const tasksFromPsCommandRecord: Record<string, TaskFromPSCommand> = {};
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 4) continue;

        const pid = parts[1];
        let cwd = "N/A";
        try {
          cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
        } catch (error) {
          // console.warn(`Unable to get cwd for PID ${pid}`);
        }
        const { year, month, day, hour, minute, second } = parser.attempt(parts.slice(3, 7).join(" "));
        let startTime = (() => {
          if (year == undefined || month == undefined || day == undefined || hour == undefined || minute == undefined || second == undefined) {
            return Date.now();
          }
          return new Date(
            year, month - 1, day, hour, minute, second
          ).getTime();
        })();
        tasksFromPsCommandRecord[pid] = ({
          pid: pid,
          ppid: parts[0],
          startDate: startTime,
          command: parts.slice(7).join(" "),
          cwd
        });
      }

      const aliveTasksWeCareAbout = Object.fromEntries(Object.entries(tasksFromPsCommandRecord).filter(([_, task]) => {
        if (!(task.ppid in tasksFromPsCommandRecord)) {
          return false;
        }
        const parentTask = tasksFromPsCommandRecord[task.ppid];
        if (!parentTask.command.includes("bash")) {
          return false;
        }
        return true;
      }));
      const LONG_TASK_THRESHOLD = 4000;
      const oldLastTasks = this.lastTasks;
      this.lastTasks = Object.fromEntries([
        ...Object.entries(this.lastTasks).filter(([pid, task]) => {
          return !(pid in aliveTasksWeCareAbout) && task.completed_at !== undefined;
        }).map(([pid, task]) => {
          if (!task.completed_at) {
            task.completed_at = Date.now();
          }
          return [pid, task];
        }),
        ...Object.values(aliveTasksWeCareAbout).map(i => {
          const task: Task = {
            pid: i.pid,
            cwd: i.cwd,
            command: i.command,
            started_at: i.startDate,
          };
          if (task.started_at < Date.now() - LONG_TASK_THRESHOLD) {
            task.completed_at = null;
          }
          return [i.pid, task];
        })]);
      if (JSON.stringify(oldLastTasks) != JSON.stringify(this.lastTasks)) {
        this.callback(this.lastTasks);
      }
    });
  }
}
