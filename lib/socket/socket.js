import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
export const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
	connectionStateRecovery: {},
});

import { setUpNewGame, createPlayer } from "../gameMethods/gameMethods.js";

export const runSockets = () => {
	io.on("connection", (socket) => {
		console.log("A user connected");

		socket.on("new-game", async (id, code, username, callback) => {
			const newGame = await setUpNewGame(id, code, username);
			console.log(newGame);

			if (newGame) {
				socket.join(code);
				callback(newGame);
			} else {
				callback(newGame);
			}
		});

		// socket.on("join-game", (id, code, username, callback) => {
		// 	const index = findGameIndexByCode(code, games).index;
		// 	const newPlayer = createPlayer(id, code, username, games);

		// 	// add new player to game
		// 	if (newPlayer.isSuccessful && index) {
		// 		socket.join(code);
		// 		games[index].players.push(newPlayer.player);

		// 		callback({
		// 			isSuccessful: true,
		// 			data: games[index],
		// 			error: newPlayer.error,
		// 		});

		// 		// update players list in everyone else's game
		// 		socket.to(code).emit("get-updated-game-state", games[index]);
		// 	} else {
		// 		callback({
		// 			isSuccessful: false,
		// 			data: games[index],
		// 			error: newPlayer.error,
		// 		});
		// 	}
		// });

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
