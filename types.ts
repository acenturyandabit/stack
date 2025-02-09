type ThreadStateEnum = "YOU_DOING" | "YOU_COULD_BE_DOING" | "DEAD" | "COMPUTER_DOING";
export type Thread = {
    thread_id: string,
    state: ThreadStateEnum
    command?: string,
    command_started_at?: number,
    ttl_timeout?: NodeJS.Timeout
};

export type ThreadsAndPids = {
    threads: Record<string, Thread>,
    pid_thread_mapping: Record<string, string>
}