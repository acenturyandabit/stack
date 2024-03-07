#!/usr/bin/env node
import express from 'express'
import fs from 'fs'
import https from 'https'
import { execSync } from "child_process";
import { WebSocketServer } from 'ws';
import cors from 'cors';

const PORT = 6234;

/*
type task {
    thread_id: string,
    state: "YOU_DOING" | "YOU_COULD_BE_DOING" | "DEAD" | "COMPUTER_DOING"
};
*/


const main = () => {
    const live_connections = [];
    const thread_state = {
        threads: {},
        pid_thread_mapping: {}
    };

    const app = build_app(thread_state, live_connections);

    watch_pids(thread_state, live_connections);

    const server = start_http_or_https_server(app, process.env["HTTPS"] == "true");
    start_websocket_server(server, live_connections);
}


const build_app = (thread_state, live_connections) => {
    const app = express();
    app.use(cors());
    app.use(express.static("frontend"));
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
            if (thread_state.threads[thread_id].state != req.query.state) {
                thread_state.threads[thread_id].state = req.query.state;
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

const start_http_or_https_server = (app, is_https) => {
    let server;
    const callback = () => {
        console.log(`server started at ${PORT}`)
    };
    if (is_https) {
        let privateKey = fs.readFileSync('server.key', 'utf8');
        let certificate = fs.readFileSync('server.crt', 'utf8');
        let httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);
        server = httpsServer.listen({ port: PORT }, callback);
    } else {
        server = app.listen(PORT, callback);
    }
    return server;
}

const start_websocket_server = (http_server, live_connections) => {
    const websocket_server = new WebSocketServer({ noServer: true });
    websocket_server.on('connection', function connection(ws) {
        live_connections.push(ws);
        ws.on('error', console.error);
    });
    http_server.on('upgrade', (req, socket, head) => {
        websocket_server.handleUpgrade(req, socket, head, (ws) => {
            websocket_server.emit('connection', ws, req)
        })
    })
    return live_connections;
}

const watch_pids = (thread_state, live_connections) => {
    setInterval(() => {
        let pids = Object.keys(thread_state.pid_thread_mapping);
        let thread_pids = {};
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
        for (let thread_id in thread_state.threads) {
            if (thread_state.threads[thread_id].pids.length == 0) {
                // RIP
                thread_state.threads[thread_id].state = "DEAD";
            }
        }

        let still_alive_pids = Object.keys(thread_state.pid_thread_mapping);
        still_alive_pids.forEach(pid => {
            const thread_id = thread_state.pid_thread_mapping[pid];
            const current_state = thread_state.threads[thread_id].state;
            const future_state = { ...thread_state.threads[thread_id] };
            try {
                const child_pid = execSync(`pgrep -P ${pid}`).toString().split("\n")[0];
                // console.log(`thread ${pid} has child ${child_pid}`)
                future_state.state = "COMPUTER_DOING";
                future_state.command = execSync(`ps -o args= -p ${child_pid}`).toString()
            } catch (e) {
                // console.log(e)
                // console.log(`thread ${pid} has no child`)
                if (future_state.state == "COMPUTER_DOING") {
                    future_state.state = "YOU_COULD_BE_DOING";
                }
            }
            thread_state.threads[thread_id] = future_state;
            live_connections.forEach(conn => {
                conn.send(JSON.stringify(thread_state.threads[thread_id]));
            });
        });
    }, 1000);
}

main();