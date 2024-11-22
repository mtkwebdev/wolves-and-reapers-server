import { redisGet, redisSet, isRedisSetSuccessful } from "../db/db.js";

const gameTemplate = {
	code: null, // uuid
	totalRounds: 1, // players.length + 1
	currentRound: 1, // initial round
	playerTurns: 1, // once playerTurns == activePlayerCount (not eliminated) then voting occurs, then turns goes back to 0
	activePlayerCount: 1, // players that aren't eliminated + 1 | if count = 2, game ends with player active player evaluation
	players: [],
};

const playerTemplate = {
	id: null,
	username: null,
	role: 0,
	isReady: false,
	isEliminated: false,
};

const playerRoles = ["Human", "Wolf", "Reaper"];

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
		message: "Unable to start new game",
	};
	try {
		const isGameAlreadyExisting = await redisGet(code);
		if (isGameAlreadyExisting) {
			return res;
		} else {
			// create game  and player from templates
			const newGame = gameTemplate;
			const newPlayer = playerTemplate;

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
			}
		}
	} catch (error) {
		res.message = error;
		console.log(res);
	} finally {
		return res;
	}
};

// export const createPlayer = (id, code, username) => {
// 	const res = {
// 		isSuccessful: false,
// 		error: "Error: unable to join game, please check your game code",
// 	};

// 	const newPlayer = playerTemplate;
// 	newPlayer.username = username;
// 	newPlayer.id = id;

// 	// check for reapers
// 	const isReaperAssigned = game?.players.some((player) => {
// 		player.role === "Reaper";
// 	});

// 	// check for wolves
// 	const isWolfAssigned = game?.players.some((player) => {
// 		player.role === "Wolf";
// 	});

// 	// assign player a role
// 	if (isReaperAssigned) {
// 		newPlayer.role = assignAsWolfOrHuman();
// 		res.isSuccessful = true;
// 	}
// 	if (isWolfAssigned) {
// 		newPlayer.role = assignAsReaperOrHuman();
// 		res.isSuccessful = true;
// 	}
// 	if (isReaperAssigned && isWolfAssigned) {
// 		newPlayer.role = "Human";
// 		res.isSuccessful = true;
// 	}

// 	res.player = newPlayer;

// 	if (res.player.role) {
// 		res.error = "";
// 	}

// 	return res;
// };
