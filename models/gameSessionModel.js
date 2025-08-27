const mongoose = require("mongoose");
const crypto = require("crypto");

const gameSessionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.ObjectId,
      ref: "Quiz",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    gameCode: {
      type: Number,
      required: true,
      unique: true,
      min: 100000,
      max: 999999,
    },
    //for socket connection
    connectionId: String,
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        username: String,
        photo: String,
        isGuest: Boolean,
        score: {
          type: Number,
          default: 0,
        },
        answers: [
          {
            questionId: {
              type: mongoose.Schema.ObjectId,
              ref: "Question",
              required: true,
            },
            answer: {
              type: String,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
            timeTaken: {
              type: Number,
              required: true,
            },
            points: {
              type: Number,
              default: 0,
            },
          },
        ],
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentQuestion: {
      questionId: {
        type: mongoose.Schema.ObjectId,
        ref: "Question",
      },
      startTime: Date,
      endTime: Date,
    },
    settings: {
      maxParticipants: {
        type: Number,
        default: 50,
        min: 2,
        max: 50,
      },
      timePerQuestion: {
        type: Number,
        default: 30,
        min: 10,
        max: 300,
      },
      maxPointsPerQuestion: {
        type: Number,
        required: true,
        default: 100,
        min: 100,
        max: 4000,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
    results: {
      leaderboard: [
        {
          userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
          username: String,
          rank: Number,
          score: Number,
          correctAnswers: Number,
          avgResponseTime: Number,
        },
      ],
    },
    createdAt: {
      type: Date,
      default: new Date(),
    },
    startedAt: Date,
    finishedAt: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

gameSessionSchema.index({ createdAt: -1 });
gameSessionSchema.index({ hostId: 1 });
gameSessionSchema.index({ "participants.username": 1 });
gameSessionSchema.index({ "participants.answers.questionId": 1 });
gameSessionSchema.index({ connectionId: 1 });

//=> Middlewares

//=> Pre population
gameSessionSchema.pre(/^find/, function (next) {
  this.populate({
    path: "quizId",
    select: "title description questions",
  }).populate({
    path: "hostId",
    select: "name photo",
  });

  next();
});

//===>Schema Methods for better handling of actions

//=> Add Participant
gameSessionSchema.methods.addParticipant = function (userId, username) {
  if (userId === this.hostId || userId === this.hostId._id) return this;

  let isGuest = false;

  let existingParticipant;
  if (userId) {
    existingParticipant = this.participants.find((p) => {
      if (p.userId) return p.userId.toString() === userId.toString();
      else return p.username.toString() === username.toString();
    });
  }

  if (userId?.toString() === this.hostId.id.toString()) {
    return this;
  } else if (existingParticipant) {
    throw new Error(
      "You have already Joined this game try to access that device",
    );
  } else if (!userId) {
    userId = null;
    isGuest = true;
  }

  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error("Game is full");
  }

  this.participants.push({
    userId,
    username,
    photo: userId
      ? `https://api.dicebear.com/9.x/big-smile/svg?seed=${userId}`
      : `https://api.dicebear.com/9.x/big-smile/svg?seed=${username}`,
    isGuest,
    score: 0,
    answers: [],
    joinedAt: new Date(),
    isActive: true,
  });

  return this.save();
};

//=>Remove participants
gameSessionSchema.methods.removeParticipant = async function (
  userId,
  username,
) {
  /*OLD CODE BEFORE CONCURRENCY

  const participantIndex = this.participants.findIndex((p) => {
    if (!userId) return p.username === username;
    return p.userId === userId;
  });
  if (participantIndex > -1) {
    this.participants.splice(participantIndex, 1);
    return this.save();
  }
  return this;*/

  try {
    const updatedGame = await this.constructor.findOneAndUpdate(
      {
        _id: this._id,
        "participants.username": username,
      },
      {
        $pull: {
          participants: { username: username },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    console.log(updatedGame);

    if (!updatedGame) {
      throw new Error(`Participant '${username}' not found or already removed`);
    }

    console.log(`Participant '${username}' removed successfully`);
    return updatedGame;
  } catch (error) {
    console.log("removeParticipant error:", error.message);
    throw error;
  }
};

//=> Submit answer of user
gameSessionSchema.methods.submitAnswer = async function (
  username,
  questionId,
  answers,
  isCorrect,
  timeTaken,
) {
  /**
   **Old Way, not satisfying ACID properties and failing some updates

   try {
    const participantIndex = this.participants.findIndex((p) => {
      console.log(p.username);
      console.log(username);
      console.log(p.username === username);
      return p.username === username;
    });

    const totalTimePerQuestionInMs = this.settings.timePerQuestion * 1000;
    const timeLeft = totalTimePerQuestionInMs - timeTaken;
    const score = isCorrect
      ? Math.round(
          (timeLeft / totalTimePerQuestionInMs) *
            this.settings.maxPointsPerQuestion,
        )
      : 0;

    const userSubmittedAnswer = {
      questionId,
      answer: answers.toString(),
      isCorrect,
      timeTaken,
      points: score,
    };

    this.participants[participantIndex]?.answers.push(userSubmittedAnswer);
    this.participants[participantIndex].score += score;
    // this.update();

    return this;
  } catch (e) {
    console.log(e.stack);
    console.log(e.message);
  }*/
  //=> New Atomic way of doing updates

  const totalTimePerQuestionInMs = this.settings.timePerQuestion * 1000;
  const timeLeft = totalTimePerQuestionInMs - timeTaken;
  const score = isCorrect
    ? Math.round(
        (timeLeft / totalTimePerQuestionInMs) *
          this.settings.maxPointsPerQuestion,
      )
    : 0;

  const userSubmittedAnswer = {
    questionId,
    answer: answers.toString(),
    isCorrect,
    timeTaken,
    points: score,
  };

  const result = await this.constructor.findOneAndUpdate(
    {
      _id: this._id,
      "participants.username": username,
    },
    {
      $push: {
        "participants.$.answers": userSubmittedAnswer,
      },
      $inc: {
        "participants.$.score": score,
      },
    },
    { new: true, runValidators: true },
  );

  if (!result) {
    throw new Error(
      "Submission failed - duplicate answer or participant not found",
    );
  }

  return result;
};

//=> Calculate leaderboard
gameSessionSchema.methods.calculateLeaderboard = async function () {
  //Old code, without Atomicity:
  /*

  const leaderboard = this.participants
    .map((p) => ({
      userId: p.userId || null,
      username: p.username,
      score: p.score,
      correctAnswers: p.answers.filter((ans) => ans.isCorrect).length,
      avgResponseTime:
        p.answers.reduce((sum, ans) => sum + ans.timeTaken, 0) /
          p.answers.length || 0,
    }))
    .sort((a, b) => {
      if (a.score === b.score) return a.avgResponseTime - b.avgResponseTime;
      return b.score - a.score;
    })
    .map((ans, index) => {
      return {
        ...ans,
        rank: index + 1,
      };
    });


  this.results.leaderboard = leaderboard;
  if (leaderboard.length > 0) {
    this.results.winner = leaderboard[0].userId;
  }

  return this.save();
  */

  const freshGame = await this.constructor.findById(this._id);

  const leaderboard = freshGame.participants
    .map((p) => ({
      userId: p.userId || null,
      username: p.username,
      score: p.score,
      correctAnswers: p.answers.filter((ans) => ans.isCorrect).length,
      avgResponseTime:
        p.answers.reduce((sum, ans) => sum + ans.timeTaken, 0) /
          p.answers.length || 0,
    }))
    .sort((a, b) => {
      if (a.score === b.score) return a.avgResponseTime - b.avgResponseTime;
      return b.score - a.score;
    })
    .map((ans, index) => {
      return {
        ...ans,
        rank: index + 1,
      };
    });

  const updatedGame = await this.constructor.findByIdAndUpdate(
    this._id,
    {
      $set: {
        "results.leaderboard": leaderboard,
        "results.winner": leaderboard[0]?.username || null,
      },
    },
    { new: true },
  );

  return updatedGame;
};

//=>Get total active participants
gameSessionSchema.statics.generateGameCode = async function () {
  // // Use current timestamp + random number
  // const now = Date.now();
  // const random = Math.floor(Math.random() * 9999);
  //
  // // Take last 2 digits of timestamp + 4-digit random = 6 digits
  // const timeComponent = now.toString().slice(-2);
  // const randomComponent = random.toString().padStart(4, "0");
  // const gameCode = parseInt(timeComponent + randomComponent);
  //
  // // Ensure it's in valid range
  // const finalCode = Math.max(100000, Math.min(999999, gameCode));
  //
  // return finalCode;
  let gameCode;
  let exists = true;

  while (exists) {
    gameCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const existingGame = await this.findOne({ gameCode });
    exists = !!existingGame;
  }

  return gameCode;
};

//=> generate connection string
gameSessionSchema.statics.generateConnectionString = async function () {
  // const timestamp = Date.now().toString(36);
  // const random = Math.random().toString(36).substring(2, 8);
  // const connectionId = timestamp + random;
  //
  // return connectionId;

  while (true) {
    const connStr =
      Date.now().toString(36) + crypto.randomBytes(5).toString("base64url");
    const exists = await this.exists({ connectionId: connStr });
    if (!exists) return connStr;
  }
};

const GameSession = mongoose.model("GameSession", gameSessionSchema);

module.exports = GameSession;
