import { createServer } from "http";
import { Server } from "socket.io";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import {
	setUpNewGame,
	createPlayer,
	findGameIndexByCode,
} from "./methods/gameMethods.js";

dotenv.config();
const httpServer = createServer();
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
	connectionStateRecovery: {},
});

if (!process.env.REDIS_URL) {
	throw new Error("REDIS_URL env variable is not set");
}
// const client = new Redis(process.env.REDIS_URL);
// client.on("connect", () => console.log("Redis connected"));
// client.on("error", console.log);

const clientSet = async (key, value, path) => {
	console.log(key, value, path);
	const JSONpath = path ? path : "$"; // set nested json data
	try {
		const res = await client.json.set(key, JSONpath, value);
		if (res) {
			console.log(`client set: ${res}`);
			return res;
		} else {
			throw res;
		}
	} catch (error) {
		console.log(`ERROR: ${error}`);
	}
};
const clientGet = async (key, path) => {
	const JSONpath = path ? path : "$"; // get nested json data
	try {
		const res = await client.json.get(key, JSONpath);
		if (res) {
			console.log(`client get: ${res}`);
			return res;
		} else {
			throw res;
		}
	} catch (error) {
		console.log(`ERROR: ${error}`);
	}
};

io.on("connection", (socket) => {
	console.log("A user connected");

	socket.on("new-game", async (id, code, username, callback) => {
		// params are in the order of data importance
		let isSuccessful = false;

		const newGame = setUpNewGame(id, code, username);
		if (newGame.isSuccessful) {
			socket.join(code);

			// const createdGame = await clientSet(code, newGame.game);
			// console.log(createdGame);
			// isSuccessful = createdGame && newGame.isSuccessful;
			isSuccessful = true;

			// return results
			callback({ isSuccessful, data: newGame, error: newGame.error });
		} else {
			callback({ isSuccessful, data: null, error: newGame.error });
		}
	});

	socket.on("join-game", (id, code, username, callback) => {
		const index = findGameIndexByCode(code, games).index;
		const newPlayer = createPlayer(id, code, username, games);

		// add new player to game
		if (newPlayer.isSuccessful && index) {
			socket.join(code);
			games[index].players.push(newPlayer.player);

			callback({
				isSuccessful: true,
				data: games[index],
				error: newPlayer.error,
			});

			// update players list in everyone else's game
			socket.to(code).emit("get-updated-game-state", games[index]);
		} else {
			callback({
				isSuccessful: false,
				data: games[index],
				error: newPlayer.error,
			});
		}
	});

	socket.on("get-updated-game-state", (code, callback) => {
		const index = findGameIndexByCode(code, games).index;
		if (index) {
			console.log(games[index].players);
			callback({ isSuccessful: true, data: games[index], error: "" });
		} else {
			callback({
				isSuccessful: false,
				data: games,
				error: "Error: unable to update game, please leave and join again",
			});
		}
	});
});

httpServer.listen(8080);
