
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
let waiting = null;

app.use(express.static("."));

io.on("connection", socket => {
  if (waiting) {
    const partner = waiting;
    waiting = null;
    partner.peer = socket;
    socket.peer = partner;
    partner.emit("offer", socket.id, null);
  } else {
    waiting = socket;
  }

  socket.on("answer", (id, desc) => {
    if (socket.peer) socket.peer.emit("answer", desc);
  });

  socket.on("disconnect", () => {
    if (socket.peer) socket.peer.emit("disconnect-peer");
    if (waiting === socket) waiting = null;
  });
});

server.listen(3000, () => console.log("Server started on port 3000"));
