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
	return playerRoles[getRandomInt(3)];
};

export const assignAsWolfOrHuman = () => {
	const roles = playerRoles.filter((role) => role !== "Reaper");
	return roles[getRandomInt(2)];
};

export const assignAsReaperOrHuman = () => {
	const roles = playerRoles.filter((role) => role !== "Wolf");
	return roles[getRandomInt(2)];
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

export const createNewPlayer = (id, username, isFirstPlayer) => {
	const newPlayer = getPlayerTemplate();
	newPlayer.id = id;
	newPlayer.username = username;

	if (isFirstPlayer) {
		newPlayer.role = assignAsAnyPlayerRoles();
		return newPlayer;
	} else {
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

		return newPlayer;
	}
};
