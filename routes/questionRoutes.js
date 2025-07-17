const express = require("express");

const questionController = require("./../controllers/questionController");

const router = express.Router();

//Routes for creating and getting all
router
  .route("/")
  .get(questionController.getQuestions)
  .post(questionController.createQuestion);

//routes for getting one specific, updating or deleting one from an ID
router
  .route("/:id")
  .get(questionController.getQuestion)
  .patch(questionController.updateQuestion)
  .delete(questionController.deleteQuestion);

module.exports = router;
