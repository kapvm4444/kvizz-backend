const mongoose = require("mongoose");
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
        isGuest: Boolean,
        score: {
          type: Number,
          default: 0,
        },
        isActive: {
          type: Boolean,
          default: true,
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
      winner: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
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
    startedAt: Date,
    finishedAt: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

gameSessionSchema.index({ createdAt: -1 });
gameSessionSchema.index({ hostId: 1 });

//===>Schema Methods for better handling of actions

//=> Add Participant
gameSessionSchema.methods.addParticipant = function (userId, username) {
  let isGuest = false;
  const existingParticipant = this.participants.find(
    (p) => p.userId.toString() === userId.toString(),
  );

  if (!userId) {
    userId = null;
    isGuest = true;
  } else if (existingParticipant) {
    throw new Error(
      "You have already Joined this game try to access that device",
    );
  }

  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error("Game is full");
  }

  this.participants.push({
    userId,
    username,
    isGuest,
    score: 0,
    answers: [],
    joinedAt: new Date(),
    isActive: true,
  });

  return this.save();
};

//=>Remove participants
gameSessionSchema.methods.removeParticipant = function (userId, username) {
  const participantIndex = this.participants.findIndex((p) => {
    if (!userId) return p.username.toString() === username.toString();
    return p.userId.toString() === userId.toString();
  });
  if (participantIndex > -1) {
    this.participants[participantIndex].isActive = false;
    return this.save();
  }
  return this;
};

//=> Submit answer of user
gameSessionSchema.methods.submitAnswer = function (
  userId,
  questionId,
  answer,
  isCorrect,
  timeTaken,
) {
  const participantIndex = this.participants.findIndex(
    (p) => p.userId.toString() === userId.toString(),
  );

  const score = isCorrect
    ? ((this.settings.maxPointsPerQuestion - timeTaken) /
        this.settings.maxPointsPerQuestion) *
      this.settings.maxPointsPerQuestion
    : 0;

  const userSubmittedAnswer = {
    questionId,
    answer,
    isCorrect,
    timeTaken,
    points: score,
  };

  this.participants[participantIndex].answers.push(userSubmittedAnswer);
  this.participants[participantIndex].score += score;
  this.save();

  return this;
};

//=> Calculate leaderboard
gameSessionSchema.methods.calculateLeaderboard = function () {
  const leaderboard = this.participants
    .map((p) => ({
      userId: p.userId,
      username: p.username,
      score: p.score,
      correctAnswers: p.answers.filter((ans) => ans.isCorrect).length,
      avgResponseTime:
        p.answers.reduce((sum, ans) => sum + ans.timeTaken, 0) /
        p.answers.length,
    }))
    .sort((a, b) => {
      if (a.score === b.score) return b.avgResponseTime - a.avgResponseTime;
      return a.score - b.score;
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
};

//=>Get total active participants
gameSessionSchema.methods.getActiveParticipants = function () {
  return this.participants.filter((p) => p.isActive);
};

//=> Static method for game code
gameSessionSchema.statics.generateGameCode = async function () {
  let gameCode;
  let exists = true;

  while (exists) {
    gameCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    const existingGame = await this.findOne({ gameCode });
    exists = !!existingGame;
  }

  return gameCode;
};

gameSessionSchema.statics.generateConnectionString = async function () {
  let connectionId;
  let exists = true;

  while (exists) {
    connectionId = Math.random()
      .toString(36)
      .substring(2, 2 + 12);

    const existingGame = await this.findOne({ connectionId });
    exists = !!existingGame;
  }

  return connectionId;
};

const GameSession = mongoose.model("GameSession", gameSessionSchema);

module.exports = GameSession;
