const Quiz = require("./../models/quizModel");

const factory = require("./handlerFactory");

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
