#!/usr/bin/env node
import express from 'express'
import fs from 'fs'
import https from 'https'
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { add_pid_routes, watch_pids } from './pid_manager';
import { ThreadAndState } from './types';
import * as httpolyglot from 'httpolyglot';

const PORT = 6234;


const main = () => {
    const live_connections = [];
    const thread_state: ThreadAndState = {
        threads: {},
        pid_thread_mapping: {}
    };

    const app = express();
    app.use(cors());

    add_pid_routes(app, thread_state, live_connections);
    watch_pids(thread_state, live_connections);

    const server = start_http_or_https_server(app, process.env["HTTPS"] == "true");
    start_websocket_server(server, live_connections);
}


const start_http_or_https_server = (app, is_https) => {
    app.use(express.static("frontend"));
    let server;
    const callback = () => {
        console.log(`server started at ${PORT}`)
    };
    if (is_https) {
        server = httpolyglot.createServer({
            key: fs.readFileSync('server.key', 'utf8'),
            cert: fs.readFileSync('server.crt', 'utf8')
        }, function (req, res) {
            if (!req.socket.encrypted) {
                // Request.url has leading slash
                res.writeHead(301, { 'Location': `https://${req.headers.host}${req.url}`});
                return res.end();
            } else {
                app(req, res);
            }
        }).listen({ port: PORT }, callback);
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



main();