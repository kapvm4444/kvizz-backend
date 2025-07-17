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
      uppercase: true,
      length: 6,
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        username: String,
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
      isPublic: {
        type: Boolean,
        default: true,
      },
      allowLateJoin: {
        type: Boolean,
        default: false,
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
    timestamps: true,
  },
);

//===>Schema Methods for better handling of actions

//=> Add Participant
gameSessionSchema.methods.addParticipant = function (userId, username) {
  const existingParticipant = this.participants.find(
    (p) => p.userId.toString() === userId.toString(),
  );
  if (existingParticipant) {
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
    score: 0,
    answers: [],
    joinedAt: new Date(),
    isActive: true,
  });

  return this.save();
};

//=>Remove participants
gameSessionSchema.methods.removeParticipant = function (userId) {
  const participantIndex = this.participants.findIndex(
    (p) => p.userId.toString() === userId.toString(),
  );
  if (participantIndex > -1) {
    this.participants[participantIndex].isActive = false;
    return this.save();
  }
  return this;
};

gameSessionSchema.methods.submitAnswer = function (
  userId,
  questionId,
  answer,
  timeTaken,
) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString(),
  );
  if (!participant) {
    throw new Error("Participant not found");
  }

  // Check if already answered this question
  const existingAnswer = participant.answers.find(
    (a) => a.questionId.toString() === questionId.toString(),
  );
  if (existingAnswer) {
    throw new Error("Already answered this question");
  }

  return participant;
};
