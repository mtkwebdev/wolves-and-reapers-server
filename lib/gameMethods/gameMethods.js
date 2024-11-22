import {
	redisGet,
	redisSet,
	isRedisSetSuccessful,
	redisAppend,
} from "../db/db.js";

const playerRoles = ["Human", "Wolf", "Reaper"];

const getGameTemplate = () => {
	return {
		code: null, // uuid
		totalRounds: 1, // players.length + 1
		currentRound: 1, // initial round
		playerTurns: 1, // once playerTurns == activePlayerCount (not eliminated) then voting occurs, then turns goes back to 0
		activePlayerCount: 1, // players that aren't eliminated + 1 | if count = 2, game ends with player active player evaluation
		players: [],
	};
};

const getPlayerTemplate = () => {
	return {
		id: null,
		username: null,
		role: 0,
		isReady: false,
		isEliminated: false,
	};
};

export const getRandomInt = (int) => {
	return Math.floor(Math.random() * int);
};

const assignAsAnyPlayerRoles = () => {
	return playerRoles[getRandomInt(3)];
};

const assignAsWolfOrHuman = () => {
	const roles = playerRoles.filter((role) => role !== "Reaper");
	return roles[getRandomInt(2)];
};
const assignAsReaperOrHuman = () => {
	const roles = playerRoles.filter((role) => role !== "Wolf");
	return roles[getRandomInt(2)];
};

export const setUpNewGame = async (id, code, username) => {
	const res = {
		isSuccessful: false,
		game: null,
		message: "Unable to start new game",
	};
	try {
		const isGameAlreadyExisting = await redisGet(code);
		if (isGameAlreadyExisting) {
			return res;
		} else {
			// create game  and player from templates
			const newGame = getGameTemplate();
			const newPlayer = getPlayerTemplate();

			// assign initial role for new player
			newPlayer.role = assignAsAnyPlayerRoles();
			newPlayer.username = username;
			newPlayer.id = id;

			// update player count
			newGame.players[0] = newPlayer;

			// assign game code to game state
			newGame.code = code;

			const gameCreated = await redisSet(code, newGame);
			if (gameCreated === isRedisSetSuccessful) {
				res.isSuccessful = true;
				res.message = "New game created successfully";
				res.game = newGame;
			}
		}
	} catch (error) {
		res.message = error;
		console.log(res);
	} finally {
		return res;
	}
};

export const isExistingPlayer = async (id, code, username) => {
	const res = {
		isSuccessful: false,
		game: null,
		message: "Error: unable to find game, please check your game code",
		error: null,
	};
	try {
		const game = await redisGet(code);
		if (!game) {
			return res;
		} else {
			res.isSuccessful = true;
			res.game = game;
			res.message = "";
		}
	} catch (error) {
		res.error = error;
		console.log(`Re-Join Game Error: ${error}`);
	} finally {
		return res;
	}
};

export const addPlayerToGame = async (id, code, username) => {
	const res = {
		isSuccessful: false,
		game: null,
		message: "Error: unable to join game, please check your game code",
	};

	try {
		const existingGame = await redisGet(code);

		if (!existingGame) {
			return res;
		} else {
			// first check if user is already in the game, if so, just return the game itself
			const game = existingGame[0];
			const listOfPlayers = game.players.map((player) => player.username);
			if (listOfPlayers.includes(username)) {
				res.isSuccessful = true;
				res.message = "";
				res.game = game;
				return game;
			} else {
				// if the player is not in the game, add them to the game as a new player
				const newPlayer = getPlayerTemplate();
				newPlayer.username = username;
				newPlayer.id = id;

				// check for reapers
				const isReaperAssigned = game?.players.some((player) => {
					player.role === "Reaper";
				});

				// check for wolves
				const isWolfAssigned = game?.players.some((player) => {
					player.role === "Wolf";
				});

				// assign player a role
				if (isReaperAssigned) {
					newPlayer.role = assignAsWolfOrHuman();
				}
				if (isWolfAssigned) {
					newPlayer.role = assignAsReaperOrHuman();
				}
				if (isReaperAssigned && isWolfAssigned) {
					newPlayer.role = "Human";
				}

				await redisAppend(code, newPlayer, "$.players");
				const updatedGame = await redisGet(code);
				if (updatedGame) {
					res.isSuccessful = true;
					res.message = "";
					res.game = updatedGame;
				}
			}
		}
	} catch (error) {
		res.error = error;
		console.log(`Join Game Error: ${error}`);
	} finally {
		return res;
	}
};
