# Stack

As a C++ software developer / databricks backtest runner, I occasionally have long-running tasks that take unpredictable amounts of time. I want to have an automated way of alerting me when those tasks are complete.

## Installation

Requirements: node/npm on your system

1. Clone this folder to somewhere out of the way.
2. Run `npm install .`
3. Add the `bashrc_supplement` to your .bashrc; restart shells or source .bashrc
4. Run the server: `./server.js`
   - You may want to use a https server (even a self-signed one) as this will allow userscripts from https sites to send requests to your server. To do this:
       1. `openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -nodes -subj "/C=XX/ST=StateName/L=CityName/O=CompanyName/OU=CompanySectionName/CN=CommonNameOrHostname"`
       2. Run instead with `HTTPS=true ./server.js`
       3. Add `STACK_HTTPS=1` to your bashrc.
5. Open the webapp according to the console output.
6. For new shells, run `stack-register-thread TASKNAME` to register a shell to a task. (You might want to alias this, its pretty long)
7. Start a long running task on your shell that you've registered. Stack will be alerted to its presence.
8. When the task is done, Stack will let you know.
9. Ack that the task is done using `stack-ack` in the same shell as the process, then keep doing your work.

## How it works

There are three actors in our model: You, the Computer, and Stack. You have a number of threads of work. Your job is to do your most urgent thread; but sometimes you ask the Computer to do your thread, e.g. compile a piece of code. When this happens, you will go work on another, less urgent thread. When the Computer has finished on your most urgent thread, the Stack will notify you that you are able to resume your most urgent thread.

(Note that the Computer can represent a build job, a cloud runner, or even another person - anything that is blocking your highest priority thread.)

A thread can be in one of four states: You're working on it, You could be working on it, the Computer is working on it, or Dead (done or cancelled).

## What Stack actually keeps track of

Stack can't actually keep track of threads-of-work; instead it can only keep track of PIDs on the system (of bash shells), or browser windows.

### Bash shells / PIDs

You should register bash shells by typing `stack-register-thread TASKNAME` to associate a bash shell to a thread. Subsequently, Stack, via `server.js`, will check whether or not the shell has any child processes. If any shell associated with the thread has a child process, Stack will assume that the Computer is working on the thread. If all shells associated with the the thread dies, Stack will assume the thread is dead.

The `server.js` will give the frontend a list of tasks, their state, and any metadata for that state (e.g. process names).

The frontend keeps a record of thread priority, and will display in large font the highest priority thread that is you're-working-on-it. This is stored in the frontend localstorage, because I can't be bothered to make a way for the server to store it right now.

### Browser / external tasks

External tasks broadcast their state as either either 'running' or 'done' with a ticket ID in the query parameter. When a task transitions from 'running' to 'done' then it will be flagged by stack and an alert will be provided to the user. The user can ack by pressing on the frontend.

