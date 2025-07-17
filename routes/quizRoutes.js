const express = require("express");

const quizController = require("./../controllers/quizController");

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

module.exports = router;
