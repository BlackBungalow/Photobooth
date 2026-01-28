const http = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*'
    }
  });

  globalThis.socketIo = io;

  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Socket connected' });
    socket.on('join', (room) => {
      if (typeof room === 'string') {
        socket.join(room);
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
