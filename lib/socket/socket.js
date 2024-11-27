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
	checkIsEliminationRound,
} from "../gameMethods/gameMethods.js";

export const runSockets = () => {
	io.on("connection", (socket) => {
		console.log("A user connected");

		socket.on("new-game", async (id, code, username, callback) => {
			const res = await setUpNewGame(id, code, username);

			if (res.isSuccessful) {
				socket.join(code);
				callback(res);
			} else {
				callback(res);
			}
		});

		socket.on("join-game", async (id, code, username, callback) => {
			const res = await addPlayerToGame(id, code, username);

			if (res.isSuccessful) {
				socket.join(code);
				// sync sender client
				callback(res);
				// sync the rest of clients
				socket.to(code).emit("game-sync", res);
			} else {
				callback(res);
			}
		});

		socket.on("increment-turns", async (code, callback) => {
			const res = await incrementTurns(code);
			if (res.isSuccessful) {
				callback(res);
				socket.to(code).emit("game-sync", res);
			} else {
				callback(res);
			}
		});

		socket.on("cast-vote", async (code, votedUsername, callback) => {
			const res = await accumulateVotes(code, votedUsername);
			const isEliminationRound = checkIsEliminationRound(res);

			if (res.isSuccessful && !isEliminationRound) {
				callback(res);
				socket.to(code).emit("game-sync", res);
			}

			if (res.isSuccessful && isEliminationRound) {
				const res = await eliminatePlayer(code);
				callback(res);
				socket.to(code).emit("player-eliminated", res);
				socket.to(code).emit("game-sync", res);
			} else {
				callback(res);
			}
		});
	});

	httpServer.listen(8080);
	console.log("server running on port 8080");
};
