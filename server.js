const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");

const socketService = require("./socket/SocketService");

//Handling the syntax errors by using process thread;s event handling
process.on("uncaughtException", (err) => {
  console.log("UNHANDLED EXCEPTION ERROR 💥");
  console.log(err.name, "=>", err.message);
  console.log(err.stack);
  process.exit(1);
});

dotenv.config({ path: "./.env" });
const app = require("./app");

const DB =
  process.env.DATABASE_TYPE === "cloud"
    ? process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD)
    : process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Fast-fail if Mongo is down
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    bufferCommands: false, // No query buffering!
  })

  .then((con) =>
    console.log(
      process.env.DATABASE_TYPE.toUpperCase() +
        " Database Connection Successful",
    ),
  );

//==>
// Listening to URL
const port = process.env.PORT || 8000;

//backend server
const server = http.createServer(app);

//socket server
socketService.initializeServer(server);

server.listen(port, () => {
  console.log(
    `The backend server and the socket server both running on port - ${port} 🚀`,
  );
});

//=> old backend server (without the socket)
// const server = app.listen(port, () => {
//   console.log(`App is running on http://127.0.0.1:${port}`);
// });

//handling the Rejections (like operational error) by using the process thread event handling
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION ERROR 💥");
  console.log(err.name, "=>", err.message);
  server.close(() => {
    process.exit(1);
  });
});
