const Quiz = require("./../models/quizModel");
const Question = require("./../models/questionModel");

const factory = require("./handlerFactory");

exports.saveQuestions = async (req, res, next) => {
  try {
    // 1. Destructure the questions array and the rest of the quiz data from the request body.
    const { questions, ...quizData } = req.body;

    // Basic validation: ensure there are questions to save.
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "A quiz must have at least one question.",
      });
    }

    // 2. Create all the question documents in the database in a single, efficient operation.
    const questionDocs = await Question.insertMany(questions);

    // 3. Extract the newly created `_id`s from the question documents.
    const questionIds = questionDocs.map((q) => q._id);

    // 4. Create the main Quiz document, including the array of question IDs.
    const newQuiz = await Quiz.create({
      ...quizData,
      questions: questionIds, // Assign the array of ObjectIDs
    });

    // 5. Populate the 'questions' field in the new quiz to return the full quiz object with questions.
    // This is good practice so the client gets the complete, saved object back.
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
