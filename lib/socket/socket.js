import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
export const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
	connectionStateRecovery: {},
});

import {
	setUpNewGame,
	addPlayerToGame,
	incrementTurns,
	accumulateVotes,
	eliminatePlayer,
} from "../gameMethods/gameMethods.js";

export const runSockets = () => {
	io.on("connection", (socket) => {
		console.log("A user connected");

		socket.on("new-game", async (id, code, username, callback) => {
			const newGame = await setUpNewGame(id, code, username);

			if (newGame.isSuccessful) {
				socket.join(code);
				callback(newGame);
			} else {
				callback(newGame);
			}
		});

		socket.on("join-game", async (id, code, username, callback) => {
			const game = await addPlayerToGame(id, code, username);

			if (game.isSuccessful) {
				socket.join(code);
				// sync sender client
				callback(game);
				// sync the rest of clients
				socket.to(code).emit("game-sync", game);
			} else {
				callback(game);
			}
		});

		socket.on("increment-turns", async (code, callback) => {
			const game = await incrementTurns(code);
			if (game.isSuccessful) {
				callback(game);
				socket.to(code).emit("game-sync", game);
			} else {
				callback(game);
			}
		});

		socket.on("cast-vote", async (code, votedUsername, callback) => {
			const game = await accumulateVotes(code, votedUsername);

			if (game.isSuccessful) {
				callback(game);

				socket.to(code).emit("game-sync", game);

				eliminatePlayerEvent(code, game);
			} else {
				callback(game);
			}
		});

		const eliminatePlayerEvent = async (code, res) => {
			const currentGame = res.game;
			const activePlayersCount = currentGame.players.filter(
				(player) => player.isEliminated === false
			)?.length;

			const isEliminationRound =
				currentGame.votes.length === activePlayersCount;

			if (isEliminationRound) {
				const game = await eliminatePlayer(code);
				socket.to(code).emit("player-eliminated", game);
			}
		};
	});

	httpServer.listen(8080);
	console.log("server running on port 8080");
};
