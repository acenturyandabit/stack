import TaskPoller from './TaskPoller';
import HTTPTaskPoller from './HTTPTaskPoller';
import express from 'express'
import * as httpolyglot from 'httpolyglot';
import fs from 'fs'
import { WebSocketServer } from 'ws';
import cors from 'cors';

const PORT = 6234;

const main = () => {
  const app = express();
  app.use(cors());

  const live_connections: any[] = [];
  const tasks_ref = {
    currentPoller: {},
    currentHTTP: {},
    current: {}
  };

  const updateAndSend = () => {
    tasks_ref.current = {};
    Object.assign(tasks_ref.current, tasks_ref.currentPoller);
    Object.assign(tasks_ref.current, tasks_ref.currentHTTP);
    live_connections.forEach(conn => {
      conn.send(JSON.stringify(tasks_ref.current));
    })
  }

  const poller = new TaskPoller(100, (tasks) => {
    tasks_ref.currentPoller = tasks;
    updateAndSend();
  });
  poller.start();

  const httpPoller = new HTTPTaskPoller(1000, (tasks) => {
    tasks_ref.currentHTTP = tasks;
    updateAndSend();
  }, app);
  httpPoller.start();

  const multiAck = {
    acknowledge: (task_id: string) => {
      poller.acknowledge(task_id);
      httpPoller.acknowledge(task_id);
    }
  };

  const server = start_http_or_https_server(app, process.env["HTTPS"] == "true");
  start_websocket_server(server, live_connections, tasks_ref, multiAck);
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
        res.writeHead(301, { 'Location': `https://${req.headers.host}${req.url}` });
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

const start_websocket_server = (http_server, live_connections, tasks_ref, poller: {
  acknowledge: (task_id: string) => void
}) => {
  const websocket_server = new WebSocketServer({ noServer: true });
  websocket_server.on('connection', function connection(ws) {
    live_connections.push(ws);
    ws.send(JSON.stringify(tasks_ref.current));
    ws.on("message", (message) => {
      const message_json = JSON.parse(message.toString());
      if (message_json.type == "acknowledge") {
        poller.acknowledge(message_json.task_id);
      }
    });
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
