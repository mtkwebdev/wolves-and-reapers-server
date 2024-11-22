import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
export const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
	connectionStateRecovery: {},
});

import { setUpNewGame, addPlayerToGame } from "../gameMethods/gameMethods.js";

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
			} else {
				callback(game);
			}
		});

		// socket.on("get-updated-game-state", (code, callback) => {
		// 	const index = findGameIndexByCode(code, games).index;
		// 	if (index) {
		// 		console.log(games[index].players);
		// 		callback({ isSuccessful: true, data: games[index], error: "" });
		// 	} else {
		// 		callback({
		// 			isSuccessful: false,
		// 			data: games,
		// 			error: "Error: unable to update game, please leave and join again",
		// 		});
		// 	}
		// });
	});

	httpServer.listen(8080);
	console.log("server running on port 8080");
};
