const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const quizController = require("./../controllers/quizController");

const router = express.Router();

//=>get questions of particular quiz
router.route("/:id/questions").get(quizController.getQuizQuestions);

//=> get user specific quizzes
router.route("/of/:userId").get(quizController.getQuizzes);

//=> create and save the quiz along with questions
router.route("/do/save").post(quizController.saveQuestions);

//=> update and save the quiz along with updated questions
router.route("/do/update").patch(quizController.updateQuizWithQuestions);

//=> delete the quiz along with the questions
router.route("/do/delete/:id").delete(quizController.deleteQuizWithQuestions);

//=> generate the quiz with ai prompt
router.route("/generate/prompt").post(quizController.generateQuizFromPrompt);

//=> generate the quiz with a csv file (ai based)
router
  .route("/generate/csv")
  .post(upload.single("file"), quizController.generateQuizFromCsv);

//=> generate a quiz from a pdf (ai based)
router
  .route("/generate/pdf")
  .post(upload.single("file"), quizController.generateQuizFromPdf);

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
