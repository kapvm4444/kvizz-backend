const mongoose = require("mongoose");
const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["multiple", "single", "open", "reorder", "trueFalse"],
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    funFact: String,
    options: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    correctAnswer: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    media: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ["image", "audio", "video"],
    },
    order: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

questionSchema.index({ quizId: 1, order: 1 });
questionSchema.index({ type: 1 });

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
