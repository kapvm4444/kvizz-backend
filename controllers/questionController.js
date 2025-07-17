const Question = require("./../models/questionModel");

const factory = require("./handlerFactory");

//get all the questions together
exports.getQuestions = factory.getAll(Question);

//get only one single questions
exports.getQuestion = factory.getOne(Question);

//create one questions
exports.createQuestion = factory.createOne(Question);

//update the questions
exports.updateQuestion = factory.updateOne(Question);

//delete questions
exports.deleteQuestion = factory.deleteOne(Question);
