type ThreadStateEnum = "YOU_DOING" | "YOU_COULD_BE_DOING" | "DEAD" | "COMPUTER_DOING";
export type Thread = {
    thread_id: string,
    state: ThreadStateEnum
    command?: string,
    command_started_at?: number,
    ttl_timeout?: NodeJS.Timeout,
    pids: string[]
};


export type ThreadsAndPids = {
    threads: Record<string, Thread>,
    pid_thread_mapping: Record<string, string>
}

// V2
export type Task = {
    pid: string,
    cwd: string,
    command: string,
    started_at: number,
    completed_at?: number | null,
  }
  