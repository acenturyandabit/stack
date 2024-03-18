type ThreadStateEnum = "YOU_DOING" | "YOU_COULD_BE_DOING" | "DEAD" | "COMPUTER_DOING";
type Thread = {
    thread_id: string,
    state: ThreadStateEnum
    command?: string,
    ttl_timeout?: NodeJS.Timeout
};

type ThreadAndState = {
    threads: Record<string, Thread>,
    pid_thread_mapping: Record<string, string>
}