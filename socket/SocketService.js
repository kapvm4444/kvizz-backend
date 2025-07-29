const GameSession = require("./../models/gameSessionModel");
const Quiz = require("./../models/quizModel");
const Question = require("./../models/questionModel");
const factory = require("./../controllers/handlerFactory");
const mongoose = require("mongoose");

const SAFE_QUERY_TIMEOUT = 5000;

class SocketService {
  constructor() {
    this.io = null;
  }

  initializeServer(server) {
    this.io = require("socket.io")(server, {
      cors: {
        // origin: ["http://localhost:3003", "http://10.0.0.100:3003"],
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    this.setupHandlers();
  }

  setupHandlers() {
    this.io.on("connect", (socket) => {
      console.log(`${socket.id} connected`);

      //=> server listeners
      //-> Create Room
      //*'create-room' - creator creates room (needs quizID, userId)
      socket.on("create-room", async (data) => {
        console.log("------------create-room socket called");
        try {
          const { quizId, hostId } = data;

          if (!quizId || !hostId) {
            console.log("Error", "Give quizId and hostId both", "Create-room");
            return socket.emit("error", "Give quizId and hostId both");
          }

          const gameCode = await GameSession.generateGameCode();
          console.log(gameCode);
          const connectionId = await GameSession.generateConnectionString();
          console.log(connectionId);

          const gameSessionData = {
            quizId,
            hostId,
            gameCode,
            connectionId,
          };

          const newGameSession = await factory.createAndReturnOne(
            GameSession,
            gameSessionData,
          );

          socket.join(newGameSession.connectionId);
          socket.emit("game-created", newGameSession);
          console.log("create-room socket End------------");
        } catch (err) {
          console.log("Error 💥💥 :" + err.message);
          socket.emit("error", err.message);
        }
      });

      //-> Join room with a code
      //*'join-room' - User joins the quiz (needs join code, userId (if not userId only then send username))
      socket.on("join-room", async (data) => {
        console.log("------------ join room called");
        try {
          const { gameCode, userId, username } = data;

          const game = await GameSession.findOne({ gameCode });

          if (!game || game.status !== "waiting") {
            console.log("Game not found");
            return socket.emit("error", "Game not found or is already Started");
          }

          if (
            game.participants.some((element) => element.username === username)
          ) {
            console.log("Username already in use");
            return socket.emit("error", "Username Already in use");
          }

          socket.join(game.connectionId);

          await game.addParticipant(userId, username);
          await game.save();

          this.io.to(game.connectionId).emit("participant-joined", game);
          console.log("join-room socket End------------");
        } catch (err) {
          console.log(err.message, err.stack);
          socket.emit("error", err.message);
        }
      });

      //-> Leave the quiz room
      //*'leave-quiz' - User leaves a quiz room (needs gameSessionId and userId or username, whichever you have sent while "join-room" event)
      socket.on("leave-quiz", async (data) => {
        console.log("------------ leave-room socket called");
        try {
          const { gameSessionId, userId, username } = data;
          const currentGame = await GameSession.findById(gameSessionId);

          const updatedGame = await currentGame.removeParticipant(
            userId,
            username,
          );

          this.io
            .to(updatedGame.connectionId)
            .emit("participant-left", { updatedGame, leftUser: username });
          console.log("leave finish------------");
        } catch (err) {
          console.log(err.message);
          socket.emit("error", err.message);
        }
      });

      //-> Start the quiz
      // * 'start-quiz' - Host starts the quiz game (needs gameSession ID)
      socket.on("start-quiz", async (data) => {
        console.log("------------start-quiz socket called");
        try {
          const { gameSessionId } = data;

          const game = await GameSession.findById(gameSessionId);
          game.status = "playing";
          game.startedAt = Date.now();
          const updatedGame = await game.save();

          this.io
            .to(updatedGame.connectionId)
            .emit("game-started", updatedGame);

          console.log("start quiz end ------------");
        } catch (e) {
          console.log(e.message);
          socket.emit("error", e.message);
        }
      });

      //-> stop quiz
      // * 'stop-quiz' - Game is ended (manually or automatic) (needs gameSession ID)
      socket.on("stop-quiz", async (data) => {
        console.log("------------stop-quiz socket called");
        try {
          const { gameSessionId } = data;

          const game = await GameSession.findById(gameSessionId);

          game.status = "finished";
          game.finishedAt = Date.now();
          game.calculateLeaderboard();
          // const updatedGame = await game.save();

          this.io.to(game.connectionId).emit("final-leaderboard", game);

          console.log("stop quiz end ------------");
        } catch (e) {
          console.log(e.message);
          socket.emit("error", e.message);
        }
      });

      //-> get questions of current running quiz
      // * 'get-questions' - Get the questions of current quiz (live) (needs gameSessionId)
      socket.on("get-questions", async (data) => {
        console.log("------------ getQuestion socket called");
        try {
          const { gameSessionId } = data;

          const game = await GameSession.findById(gameSessionId);
          const quiz = await Quiz.findById(game.quizId);

          socket.emit("load-questions", quiz);

          console.log("get questions end ------------");
        } catch (err) {
          console.log(err.message);
          socket.emit("error", err.message);
        }
      });

      //-> submit answer and save in the gameSession db
      /** 'submit-answer' - User submits answer to current question (needs answer data
       * [gameSessionId, userId, questionId, answer, isCorrect, timeTaken])*/
      socket.on("submit-answer", async (data) => {
        console.log("------------ submitAns socket called");
        try {
          const {
            gameSessionId,
            username,
            questionId,
            answer,
            isCorrect,
            timeTaken,
          } = data;

          console.log(data);

          /*const abc = {
            "gameSessionId": "687c6ca8505a1a67c89410ab",
            "username": "lalo",
            "questionId": "687b8880d8bc302e78779d3f",
            "answer": "express",
            "isCorrect": true,
            "timeTaken": 30000,
          };*/

          const game = await GameSession.findById(gameSessionId);
          await game.submitAnswer(
            username,
            questionId,
            answer,
            isCorrect,
            timeTaken,
          );
          const updatedGame = await game.calculateLeaderboard();
          // const updatedGame = await game.save();

          this.io
            .to(updatedGame.connectionId)
            .emit("live-scores-updated", updatedGame);

          console.log("submit answer end ------------");
        } catch (e) {
          console.log(e.message);
          socket.emit("error", e.message);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log(`${socket.id} Disconnected. Due to ${reason}`);
      });
    });
  }
}

module.exports = new SocketService();

//=> Server APIs
/*
 *
 * /api/v1/quiz/:userId == get user specific quizzes
 * /api/v1/quiz/save == save-questions from user
 * /api/v1/quiz/:id/questions == get the questions of the specific quiz (not in live quiz)
 * /api/v1/quiz/live == get all the live and public quiz
 * /api/v1/quiz/update == update the quiz and related questions if there any update in the questions
 * /api/v1/quiz/generate/prompt == generate the quiz with AI prompt
 * /api/v1/quiz/generate/csv ==  generate the quiz with user uploaded CSV file
 * /api/v1/quiz/generate/pdf == generate the quiz with user uploaded pdf file
 *
 * */
//=> Sockets that Server listens (Client -> Server)
/**
 * 'create-room' - creator creates room (needs quizID, userId)
 * 'join-room' - User joins the quiz (needs join code, userId (if not userId only then send username))
 * 'leave-quiz' - User leaves a quiz room (needs userId or username, whichever you have sent while "join-room" event)
 * 'start-quiz' - Host starts the quiz game (needs gameSession ID)
 * 'stop-quiz' - Game is ended (manually or automatic) (needs gameSession ID)
 *
 * 'get-questions' - Get the questions of current quiz (live) (needs gameSessionId)
 *
 * 'submit-answer' - User submits answer to current question (needs answer data
 * [gameSession, userId, questionId, answer, isCorrect, timeTaken])
 *
 * */
//=> sockets that server emits (Server -> Client)
/**
 * 'game-created' - Confirm quiz room creation with game code (will update the database and send updated Data (data - gameSession))
 * 'game-started' - Notify all participants that quiz has begun (will update data base and send updated data (data - gameSession))
 * 'participant-joined' - Notify all participants when someone joins (will send updated gameSession Data)
 * 'participant-left' - Notify all participants when someone leaves (will send updated gameSession Data)
 * 'participant-disconnected' - Notify when someone disconnects unexpectedly (will send updated gameSession Data)
 * 'participants-updated' - Send updated participant list to all users (will send updated gameSession Data)
 * 'participant-kicked' - Notify when someone is removed (will send updated gameSession Data)
 *
 * 'load-questions' - Send questions array to user
 *
 * 'live-scores-updated' - Send real-time scoreboard updates (when the 'submit-answer' triggers, will send updated gameSession)
 * 'final-leaderboard' - Send complete results and rankings (same as 'live-score-updated' just need to interpret differently in frontend)
 *
 * ---Errors That Server Sends--- (these are error messages I will send if corresponding error occurs)
 *     'error' - General error messages
 *     'quiz-not-found' - Game code doesn't exist
 *     'quiz-already-started' - User tries to join active quiz
 *     'connection-timeout' - Connection issues
 * */
