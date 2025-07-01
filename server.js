
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let waitingUser = null;

app.use(express.static("."));

io.on("connection", socket => {
  socket.on("join", () => {
    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      waitingUser.emit("ready");
      socket.emit("ready");
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("offer", offer => {
    if (socket.partner) socket.partner.emit("offer", offer);
  });

  socket.on("answer", answer => {
    if (socket.partner) socket.partner.emit("answer", answer);
  });

  socket.on("ice", ice => {
    if (socket.partner) socket.partner.emit("ice", ice);
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("disconnectPeer");
      socket.partner.partner = null;
    }
    socket.partner = null;
    socket.emit("disconnectPeer");
    socket.emit("join");
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("disconnectPeer");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
