const GameSession = require("./../models/gameSessionModel");

const factory = require("./handlerFactory");

exports.filterPublicQuizzes = (req, res, next) => {
  req.params.filterPublic = { "settings.isPublic": true, status: "waiting" };
  next();
};

//get all the game sessions together (history)
exports.getGameSessions = factory.getAll(GameSession);

//get only one single game sessions
exports.getGameSession = factory.getOne(GameSession);

//create one game sessions
exports.createGameSession = factory.createOne(GameSession);

//update the game sessions
exports.updateGameSession = factory.updateOne(GameSession);

//delete game sessions
exports.deleteGameSession = factory.deleteOne(GameSession);
