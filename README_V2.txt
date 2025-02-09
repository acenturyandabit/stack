# Stack

As a C++ software developer / databricks backtest runner, I occasionally have long-running tasks that take unpredictable amounts of time. I want to have an automated way of alerting me when those tasks are complete.

## Features:
- Tasks that are the direct child of a shell are automatically detected and listed in the UI. Tasks running for longer than 30 seconds are persisted when completed and raise a colour alert until the user acknowledges the completion.
- Tasks will be automatically acknowledged if their parent shell spawns a new child process.
- Long running tasks can be manually added by sending a POST request to the server. This is useful for long running tasks that are not automatically detected.
- Tasks can be acknowledged by sending a POST request to the server.