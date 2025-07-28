const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const Quiz = require("./../models/quizModel");
const Question = require("./../models/questionModel");

const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

const PYTHON_SERVER_URL = "http://localhost:4000";

//=> Generate from a prompt
exports.generateQuizFromPrompt = async (req, res) => {
  try {
    const { prompt, ...quizData } = req.body;
    if (!prompt) {
      return res
        .status(400)
        .json({ status: "fail", message: "Prompt is required." });
    }
    const response = await axios.post(`${PYTHON_SERVER_URL}/from-prompt`, {
      prompt,
    });
    const questionDocs = await Question.insertMany(response.data.questions);
    const questionIds = questionDocs.map((q) => q._id);
    const quiz = await Quiz.create({ ...quizData, questions: questionIds });
    const populatedQuiz = await Quiz.findById(quiz._id).populate("questions");
    res.status(201).json({ status: "success", data: { quiz: populatedQuiz } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

//=> Generate quiz from PDF file
exports.generateQuizFromPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "fail", message: "PDF file is required." });
    }
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    const response = await axios.post(`${PYTHON_SERVER_URL}/from-pdf`, form, {
      headers: form.getHeaders(),
    });
    const { questions, ...quizData } = req.body;
    const questionDocs = await Question.insertMany(response.data.questions);
    const questionIds = questionDocs.map((q) => q._id);
    const quiz = await Quiz.create({ ...quizData, questions: questionIds });
    const populatedQuiz = await Quiz.findById(quiz._id).populate("questions");
    res.status(201).json({ status: "success", data: { quiz: populatedQuiz } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

//=> Generate quiz from CSV file
exports.generateQuizFromCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "fail", message: "CSV file is required." });
    }
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    const response = await axios.post(`${PYTHON_SERVER_URL}/from-csv`, form, {
      headers: form.getHeaders(),
    });
    const { questions, ...quizData } = req.body;
    const questionDocs = await Question.insertMany(response.data.questions);
    const questionIds = questionDocs.map((q) => q._id);
    const quiz = await Quiz.create({ ...quizData, questions: questionIds });
    const populatedQuiz = await Quiz.findById(quiz._id).populate("questions");
    res.status(201).json({ status: "success", data: { quiz: populatedQuiz } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

//=> create and save the questions from the request
exports.saveQuestions = async (req, res, next) => {
  try {
    const { questions, ...quizData } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "A quiz must have at least one question.",
      });
    }

    const questionDocs = await Question.insertMany(questions);

    const questionIds = questionDocs.map((q) => q._id);

    const newQuiz = await Quiz.create({
      ...quizData,
      questions: questionIds,
    });

    await User.findByIdAndUpdate(newQuiz.creator, {
      $addToSet: { ownedQuizzes: newQuiz._id },
    });

    const populatedQuiz = await Quiz.findById(newQuiz._id).populate(
      "questions",
    );

    // 6. Send the successful response.
    res.status(201).json({
      status: "success",
      data: {
        quiz: populatedQuiz,
      },
    });
  } catch (err) {
    // Handle potential errors, such as validation failures.
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }

  // const { quizData, creator } = req.body;
  // const newQuestions = quizData.questions;
  // const newCreatedQuestions = await Question.create(newQuestions);
  //
  // quizData.questions = newCreatedQuestions.map((el) => el._id);
  // quizData.creator = creator;
  //
  // const newQuizData = await Quiz.create(quizData);
  //
  // res.status(201).json({
  //   status: "success",
  //   message: `${newQuizData.title} quiz created and saved`,
  // });
};

//=> update all the questions
exports.updateQuizWithQuestions = async (req, res) => {
  try {
    const { _id: quizId, questions, ...quizData } = req.body;

    if (!quizId) {
      return res.status(400).json({
        status: "fail",
        message: "Quiz ID is missing in the request body.",
      });
    }

    const questionPromises = questions.map((q) => {
      if (q._id) {
        return Question.findByIdAndUpdate(q._id, q, {
          new: true,
          runValidators: true,
        });
      }

      return Question.create(q);
    });

    const savedQuestions = await Promise.all(questionPromises);

    const questionIds = savedQuestions.map((q) => q._id);

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { ...quizData, questions: questionIds, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if (!updatedQuiz) {
      return res.status(404).json({
        status: "fail",
        message: "No quiz found with that ID to update.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        quiz: updatedQuiz,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

//=> delete the quiz and the questions both together
exports.deleteQuizWithQuestions = async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new AppError("No document found with that ID", 404));

  const questionIds = quiz.questions.map((q) => q.id);

  if (questionIds)
    for (const questionId of questionIds) {
      await Question.findByIdAndDelete(questionId);
    }

  const doc = await Quiz.findByIdAndDelete(req.params.id);

  if (!doc) return next(new AppError("No document found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
};

exports.getQuizQuestions = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        status: "fail",
        message: "No quiz found with that ID",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        questions: quiz.questions,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

//get all the quiz together
exports.getQuizzes = factory.getAll(Quiz);

//get only one single quiz
exports.getQuiz = factory.getOne(Quiz);

//create one quiz
exports.createQuiz = factory.createOne(Quiz);

//update the quiz
exports.updateQuiz = factory.updateOne(Quiz);

//delete quiz
exports.deleteQuiz = factory.deleteOne(Quiz);

/*
 * /api/v1/quiz/generate/prompt == generate the quiz with AI prompt
 * /api/v1/quiz/generate/csv ==  generate the quiz with user uploaded CSV file
 * /api/v1/quiz/generate/pdf == generate the quiz with user uploaded pdf file
 *
 * */
