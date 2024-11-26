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
				callback(game);
				updateClient(code, game);
			} else {
				callback(game);
			}
		});

		socket.on("increment-turns", async (code, callback) => {
			const game = await incrementTurns(code);
			if (game.isSuccessful) {
				callback(game);
				updateClient(code, game);
			} else {
				callback(game);
			}
		});

		socket.on("cast-vote", async (code, callback) => {
			const game = await accumulateVotes(code);
			if (game.isSuccessful) {
				callback(game);
				updateClient(code, game);

				const activePlayersCount = updatedGame.players.filter(
					(player) => player.isEliminated === false
				)?.length;

				const isEliminationRound =
					updatedGame.votes.length === activePlayersCount;

				if (isEliminationRound) {
					eliminatePlayerEvent(code);
				}
			} else {
				callback(game);
			}
		});

		const eliminatePlayerEvent = async (code) => {
			const game = await eliminatePlayer(code);
			if (game.isSuccessful) {
				callback(game);
				socket.to(code).emit("player-eliminated", game);
			} else {
				callback(game);
			}
		};

		const updateClient = (code, game) => {
			// to all clients in room1 except the sender
			socket.to(code).emit("update-client", game);
		};
	});

	httpServer.listen(8080);
	console.log("server running on port 8080");
};
