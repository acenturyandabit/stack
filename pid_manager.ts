import { ThreadAndState, Thread } from "./types";
import { execSync } from "child_process";

export const add_pid_routes = (app, thread_state: ThreadAndState, live_connections) => {
    app.post("/status", (req, res) => {
        if (req.query.type == "associate-pid") {
            thread_state.pid_thread_mapping[req.query.pid] = req.query.thread_id;
            thread_state.threads[req.query.thread_id] = {
                thread_id: req.query.thread_id,
                state: "YOU_DOING"
            }
            live_connections.forEach(conn => {
                conn.send(JSON.stringify(thread_state.threads[req.query.thread_id]));
            });
            res.status(200).end();
        } else if (req.query.type == "post-update") {
            let thread_id = req.query.thread_id;
            if (!thread_id) {
                thread_id = thread_state.pid_thread_mapping[req.query.pid];
            }
            if (!thread_state.threads[thread_id]) thread_state.threads[thread_id] = {
                state: "DEAD",
                thread_id: thread_id
            }
            if (thread_state.threads[thread_id].state != req.query.state) {
                thread_state.threads[thread_id].state = req.query.state;
            }
            if (thread_state.threads[thread_id].ttl_timeout) {
                clearTimeout(thread_state.threads[thread_id].ttl_timeout);
            }
            if (req.query.ttl) {
                thread_state.threads[thread_id].ttl_timeout = setTimeout(() => {
                    thread_state.threads[thread_id].state = "DEAD";
                    live_connections.forEach(conn => {
                        conn.send(JSON.stringify(thread_state.threads[thread_id]));
                    });
                }, Number(req.query.ttl))
            }
            live_connections.forEach(conn => {
                conn.send(JSON.stringify(thread_state.threads[thread_id]));
            });
            res.status(200).end();
        } else {
            res.status(400).end();
        }
    })
    return app;
}


export const watch_pids = (thread_state, live_connections) => {
    setInterval(() => {
        let pids = Object.keys(thread_state.pid_thread_mapping);
        let threads_with_pid = Object.values(thread_state.pid_thread_mapping) as string[];
        // check for alive threads
        for (let thread_id in thread_state.threads) {
            thread_state.threads[thread_id].pids = [];
        }
        // check if PIDs are still alive
        pids.forEach(pid => {
            try {
                execSync(`ps -p ${pid}`);
                thread_state.threads[thread_state.pid_thread_mapping[pid]].pids.push(pid);
                // console.log(`thread ${pid} still alive`)
            } catch (e) {
                delete thread_state.pid_thread_mapping[pid];
                // console.log(`thread ${pid} dead`)
            }
        });
        // check dead PIDs
        threads_with_pid.forEach((thread_id: string) => {
            if (thread_state.threads[thread_id].pids.length == 0) {
                // RIP
                thread_state.threads[thread_id].state = "DEAD";
            }
        })

        let still_alive_pids = Object.keys(thread_state.pid_thread_mapping);
        still_alive_pids.forEach(pid => {
            const thread_id = thread_state.pid_thread_mapping[pid];
            const current_state = thread_state.threads[thread_id];
            const future_state: Thread = { ...current_state };
            try {
                const LONG_TASK_THRESHOLD = 3500;
                const child_pid = execSync(`pgrep -P ${pid}`).toString().split("\n")[0];
                // console.log(`thread ${pid} has child ${child_pid}`)
                future_state.command = execSync(`ps -o args= -p ${child_pid}`).toString()
                if (current_state.command_started_at == undefined) {
                    future_state.command_started_at = Date.now()
                } else if (Date.now() - current_state.command_started_at > LONG_TASK_THRESHOLD) {
                    future_state.state = "COMPUTER_DOING";
                }
            } catch (e) {
                // console.log(e)
                // console.log(`thread ${pid} has no child`)
                future_state.command_started_at = undefined;
                if (future_state.state == "COMPUTER_DOING") {
                    future_state.state = "YOU_COULD_BE_DOING";
                }
            }
            thread_state.threads[thread_id] = future_state;
        });
        for (const thread_id in thread_state.threads) {
            live_connections.forEach(conn => {
                conn.send(JSON.stringify(thread_state.threads[thread_id]));
            });
        }
    }, 1000);
}