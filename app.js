const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const userRouter = require("./routes/userRoutes");
const questionRouter = require("./routes/questionRoutes");
const quizRouter = require("./routes/quizRoutes");
const gameSessionRouter = require("./routes/gameSessionRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

console.log(process.env.NODE_ENV, "mode from app.js");

app.use(
  cors({
    credentials: true,
    origin: "*",
  }),
);

app.enable("trust proxy");

//Using the "express.static()" middleware for accessing the static file in the file system (server)
//serving static files
app.use(express.static(`${__dirname}/public`));

//1) Global Middlewares ----------------------------------------------------------
//helmet - for securing some http headers
app.use(helmet());

//for setting and getting cookies
app.use(cookieParser());

app.use(compression());

//Development logging (logs)
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

//API Rate limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    "Too many requests from this IP, please wait for a few hour before you log in again",
});
app.use("/api", limiter);

//body parser - reading data from req.body
app.use(express.json({ limit: "10kb" }));

//sanitize the data (when someone try to get access without entering proper email and password)
app.use(mongoSanitize());

//block XSS (cross-site scripting attacks)
app.use(xss());

// block http parameters pollutions (hpp) [simply removes the duplicate query string in URL]
app.use(
  hpp({}),
  //-------^----
  //if want to allow any fields for duplication use "whitelist: [<string-array-of-name-of-attributes>]" and pass as an object inside hpp arguments
);

// 2) Route Handlers and methods -------------------------------------------

//Routes ---------------------------------------------------------------
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/quiz", quizRouter);
app.use("/api/v1/game", gameSessionRouter);

//set default route
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Cannot find ${req.originalUrl} in the server! Route does not exist`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

module.exports = app;
