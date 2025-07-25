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
const obscenity = require("obscenity");
const {
  TextCensor,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} = require("obscenity");

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
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message:
//     "Too many requests from this IP, please wait for a few hour before you log in again",
// });
// app.use("/api", limiter);

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

const censor = new TextCensor();
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

//=> cleaner for filtering abusive words
const cleaner = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      const input = obj[key];
      const matches = matcher.getAllMatches(input);
      obj[key] = censor.applyTo(input, matches);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      cleaner(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) {
    cleaner(req.body);
  }
  next();
});

// 2) Route Handlers and methods -------------------------------------------

//Routes ---------------------------------------------------------------
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/quizzes", quizRouter);
app.use("/api/v1/games", gameSessionRouter);

app.use("/", (req, res, next) => {
  res.end(
    "Welcome to Kvizz api page. Obviously if you are not a developer, you wont get anything ;) ",
  );
});

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
