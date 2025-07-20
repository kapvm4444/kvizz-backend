const mongoose = require("mongoose");
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    questions: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Question",
      },
    ],
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["manual", "ai-generated"],
      default: "manual",
    },
    category: String,
    tags: [String],
    stats: {
      timesPlayed: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      totalUserPlayed: {
        type: Number,
      },
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
    },
    questionOrder: {
      type: String,
      enum: ["random", "fixed"],
      default: "fixed",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

quizSchema.index({ creator: 1 });
quizSchema.index({ category: 1, difficulty: 1 });
quizSchema.index({ "stats.timesPlayed": -1 });
quizSchema.index({ createdAt: -1 });
quizSchema.index({ tags: 1 });

//=> Middlewares
quizSchema.pre(/^find/, function (next) {
  this.populate({
    path: "questions",
    select: "-createdAt -__v -quizId",
  });

  next();
});

//=> update quiz stats
quizSchema.methods.updateStats = function (totalGameScore, numOfUserPlayed) {
  this.stats.timesPlayed += 1;
  this.stats.totalUserPlayed += numOfUserPlayed;

  const totalScore =
    this.stats.averageScore * (this.stats.totalUserPlayed - numOfUserPlayed) +
    totalGameScore;
  this.stats.averageScore = totalScore / this.stats.totalUserPlayed;

  return this.save();
};

//=> randomized all question
quizSchema.methods.getRandomizedQuestions = function () {
  if (this.settings.questionOrder === "random") {
    const shuffled = [...this.questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  return this.questions;
};

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
