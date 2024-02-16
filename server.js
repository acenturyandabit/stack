#!/usr/bin/env node
import express from 'express'
import fs from 'fs';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const PORT = 6234;

const main = () => {
    const live_connections = [];
    const http_server = start_http_server(live_connections);
    start_websocket_server(http_server, live_connections);
}


const start_http_server = (live_connections) => {
    const app = express();
    app.use(cors());
    app.use(express.static("frontend"));
    app.post("/status", (req, res) => {
        if (req.query.shell_id) {
            live_connections.forEach(conn => {
                conn.send(JSON.stringify(req.query))
            });
            res.status(200).end();
        } else {
            res.status(400).end();
        }
    })
    return app.listen(PORT, () => {
        console.log(`server started at ${PORT}`)
    });
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