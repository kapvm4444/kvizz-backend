const express = require("express");

const gameSessionController = require("./../controllers/gameSessionController");

const router = express.Router();

//Routes for creating and getting all
router
  .route("/")
  .get(gameSessionController.getGameSessions)
  .post(gameSessionController.createGameSession);

//routes for getting one specific, updating or deleting one from an ID
router
  .route("/:id")
  .get(gameSessionController.getGameSession)
  .patch(gameSessionController.updateGameSession)
  .delete(gameSessionController.deleteGameSession);

module.exports = router;
