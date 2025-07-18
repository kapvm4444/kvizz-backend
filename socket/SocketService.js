class SocketService {
  constructor() {
    this.io = null;
    this.chatData = [
      {
        id: "Server_id_1234",
        text: "Hello Fellas",
        user: "Server",
        timeStamp: new Date(),
      },
    ];
    this.currentActiveUsers = [];
  }

  initializeServer(server) {
    this.io = require("socket.io")(server, {
      cors: {
        origin: "*", // Add your device IP
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
      },
    });
    this.setupHandlers();
  }

  setupHandlers() {
    this.io.on("connect", (socket) => {
      console.log(`connected User = ${socket.id}`);

      socket.on("join-room", (data) => {
        this.currentActiveUsers.push({
          socketId: socket.id,
          username: data.name,
        });
        socket.join("chat-room");
        this.io
          .to("chat-room")
          .emit("update-user-count", this.currentActiveUsers.length);
        this.io.to("chat-room").emit("update-data", this.chatData);
      });

      socket.on("send-message", (data) => {
        this.chatData = [...this.chatData, data];
        this.io.to("chat-room").emit("update-data", this.chatData);
      });

      socket.on("leave", () => {
        console.log(`User disconnected: ${socket.id}`);
        const index = this.currentActiveUsers.findIndex(
          (user) => user.socketId === socket.id,
        );
        if (index !== -1) {
          this.currentActiveUsers.splice(index, 1);
          socket.leave("chat-room");
          this.io
            .to("chat-room")
            .emit("update-user-count", this.currentActiveUsers.length);
        }
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

        const index = this.currentActiveUsers.findIndex(
          (user) => user.socketId === socket.id,
        );
        if (index !== -1) {
          this.currentActiveUsers.splice(index, 1);
          socket.leave("chat-room");
          this.io
            .to("chat-room")
            .emit("update-user-count", this.currentActiveUsers.length);
        }
      });
    });
  }
}

module.exports = new SocketService();
