export const getGameTemplate = () => {
	return {
		code: null, // uuid
		currentRound: 1,
		playerTurns: 0,
		players: [],
		votes: [],
	};
};

export const getPlayerTemplate = () => {
	return {
		id: null,
		username: null,
		role: 0,
		isReady: false,
		isEliminated: false,
	};
};

const playerRoles = ["Human", "Wolf", "Reaper"];

const getRandomInt = (int) => {
	return Math.floor(Math.random() * int);
};

export const assignAsAnyPlayerRoles = () => {
	const index = getRandomInt(3);
	console.log("any", playerRoles[index]);
	return playerRoles[index];
};

export const assignAsWolfOrHuman = () => {
	const roles = playerRoles.filter((role) => role !== "Reaper");
	const index = getRandomInt(2);
	console.log("wolforhuman", roles, roles[index]);
	return roles[index];
};

export const assignAsReaperOrHuman = () => {
	const roles = playerRoles.filter((role) => role !== "Wolf");
	const index = getRandomInt(2);
	console.log("reaperhuman", roles, roles[index]);
	return roles[index];
};

export const defaultRes = (message) => {
	return {
		isSuccessful: false,
		game: null,
		message: `Error: unable to ${message}`,
	};
};

export const successfulRes = (game, message) => {
	return {
		isSuccessful: true,
		game: game,
		message: message ? `${message}` : "",
	};
};

export const createNewPlayer = (id, username, game, isFirstPlayer) => {
	const newPlayer = getPlayerTemplate();
	newPlayer.id = id;
	newPlayer.username = username;

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
	} else if (isWolfAssigned) {
		newPlayer.role = assignAsReaperOrHuman();
	} else if (isReaperAssigned && isWolfAssigned) {
		newPlayer.role = "Human";
	} else {
		newPlayer.role = assignAsAnyPlayerRoles();
	}
	return newPlayer;
};
