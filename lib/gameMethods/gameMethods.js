import {
	redisGet,
	redisSet,
	isRedisSetSuccessful,
	redisAppend,
} from "../db/db.js";

import {
	getGameTemplate,
	createNewPlayer,
	defaultRes,
	successfulRes,
} from "./dataTemplates.js";

export const setUpNewGame = async (id, code, username) => {
	let res = defaultRes("start new game");
	try {
		const isGameAlreadyExisting = await redisGet(code);
		if (isGameAlreadyExisting) {
			return res;
		} else {
			// create game  and player from templates
			const newGame = getGameTemplate();
			const newPlayer = createNewPlayer(id, username, newGame, true);

			// add player to the game
			newGame.players[0] = newPlayer;

			// assign game code to game state
			newGame.code = code;

			const createdGame = await redisSet(code, newGame);

			if (createdGame === isRedisSetSuccessful) {
				res = successfulRes(newGame, "New game created successfully");
				return res;
			}
		}
	} catch (error) {
		res.error = error;
		console.log(res);
	} finally {
		return res;
	}
};

export const addPlayerToGame = async (id, code, username) => {
	let res = defaultRes("join game, please check your game code");

	try {
		const existingGame = await redisGet(code);

		if (!existingGame[0].code) {
			return res;
		} else {
			// return the existing game if the player has already joined
			const game = existingGame[0];
			const listOfPlayers = game.players.map((player) => player.username);
			const isExistingPlayer = listOfPlayers.includes(username);
			if (isExistingPlayer) {
				res = successfulRes(game, "user already exists, joining game");
				return res;
			} else {
				// if the player is not in the game, add them to the game as a new player
				const newPlayer = createNewPlayer(id, username, game, false);
				const newPlayerAdded = await redisAppend(code, newPlayer, "$.players");
				const updatedGame = await redisGet(code);
				if (newPlayerAdded && updatedGame) {
					res = successfulRes(updatedGame[0], "player joined successfully");
					return res;
				}
			}
		}
	} catch (error) {
		res.error = error;
	} finally {
		return res;
	}
};

export const incrementTurns = async (code) => {
	let res = defaultRes("take a turn");

	try {
		const existingGame = await redisGet(code);
		if (!existingGame[0].code) {
			return res;
		} else {
			const game = existingGame[0];
			game.playerTurns += 1;

			const isGameUpdated = await redisSet(code, game);
			if (isGameUpdated === isRedisSetSuccessful) {
				res = successfulRes(game);
				return res;
			}
		}
	} catch (error) {
		res.error = error;
	} finally {
		return res;
	}
};
export const accumulateVotes = async (code, votedUsername) => {
	let res = defaultRes("take a vote");

	try {
		console.log(code, votedUsername);
		const voting = await redisAppend(code, `"${votedUsername}"`, "$.votes");
		const updatedGame = await redisGet(code);
		const game = updatedGame[0];
		res.game = game; // set res default game
		if (voting && game.code) {
			res = successfulRes(game);
			res.game.playerTurns = 0;
			return res;
		}
	} catch (error) {
		res.error = error;
	} finally {
		return res;
	}
};

const findMostFrequentVote = (arr) => {
	return arr.reduce((a, b) =>
		arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length
			? a
			: b
	);
};

export const eliminatePlayer = async (code) => {
	let res = defaultRes("carry out elimination");

	try {
		const existingGame = await redisGet(code);

		if (!existingGame[0].code) {
			return res;
		} else {
			const game = existingGame[0];
			res.game = game; // set res default game
			const eliminatedUsername = findMostFrequentVote(game.votes);
			// eliminate player
			const indexOfPlayer = game.players.findIndex(
				(player) =>
					player.username.toLowerCase() === eliminatedUsername.toLowerCase()
			);
			game.players[indexOfPlayer].isEliminated = true;

			// increment round and reset votes
			game.currentRound += 1;
			game.votes = [];

			const updatedGame = await redisSet(code, game);

			if (updatedGame === isRedisSetSuccessful) {
				res = successfulRes(game);
				return res;
			}
		}
	} catch (error) {
		res.error = error;
	} finally {
		return res;
	}
};
