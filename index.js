const express = require("express");
const app = express();

const server = require("http").createServer(app);
const { Server } = require("socket.io");
const { addUser, removeUser, getUser } = require("./utils/users");

const io = new Server(server);

app.get("/", (req, res) => {
  res.send("Whiteboard sharing app");
});

let roomIdGlobal, imgURLGlobal;
io.on("connection", (socket) => {
  const socketId = socket.id;
  socket.on("userJoined", (data) => {
    const { name, roomId, user, host, presenter } = data;
    roomIdGlobal = roomId;
    socket.join(roomId);
    const userData = { name, roomId, user, host, presenter, socketId };
    const users = addUser(userData);
    socket.emit("userIsJoined", { success: true, data, users });
    socket.broadcast.to(roomId).emit("userJoinedMessageBroadcasted", name);
    socket.broadcast.to(roomId).emit("allUsers", users);
    socket.broadcast.to(roomId).emit("whiteboardDataResponse", {
      imgURL: imgURLGlobal,
    });
  });
  socket.on("whiteboardData", (data) => {
    imgURLGlobal = data;
    socket.broadcast.to(roomIdGlobal).emit("whiteboardDataResponse", {
      imgURL: data,
    });
  });

  socket.on("message", (data) => {
    const { message } = data;
    console.log("msg", data);
    const user = getUser(socket.id);
    if (user) {
      socket.broadcast
        .to(roomIdGlobal)
        .emit("messageResponse", { message, name: user.name });
    }
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    removeUser(socket.id);
    console.log("dd", user);
    if (user) {
      console.log("user", user);
      socket.broadcast
        .to(roomIdGlobal)
        .emit("userLeftMessageBroadcasted", user.name);
    }
  });
});
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server is running on ${port}`));
