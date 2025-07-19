const express = require("express");

const quizController = require("./../controllers/quizController");
const questionRouter = require("./questionRoutes");

const router = express.Router();

//Routes for creating and getting all
router
  .route("/")
  .get(quizController.getQuizzes)
  .post(quizController.createQuiz);

//routes for getting one specific, updating or deleting one from an ID
router
  .route("/:id")
  .get(quizController.getQuiz)
  .patch(quizController.updateQuiz)
  .delete(quizController.deleteQuiz);

router.route("/:id/questions").get(quizController.getQuizQuestions);

router.route("/of/:userId").get(quizController.getQuizzes);

router.route("/save").post(quizController.saveQuestions);

router.route("/update").patch(quizController.updateQuizWithQuestions);

module.exports = router;

/*
 *
 * /api/v1/quiz/of/:userId == get user specific quizzes
 * /api/v1/quiz/save == save-questions from user
 * /api/v1/quiz/:id/questions == get the questions of the specific quiz (not in live quiz)
 * /api/v1/quiz/explore == get all the live and public quiz
 * /api/v1/quiz/update == update the quiz and related questions if there any update in the questions
 * /api/v1/quiz/generate/prompt == generate the quiz with AI prompt
 * /api/v1/quiz/generate/csv ==  generate the quiz with user uploaded CSV file
 * /api/v1/quiz/generate/pdf == generate the quiz with user uploaded pdf file
 *
 * */
