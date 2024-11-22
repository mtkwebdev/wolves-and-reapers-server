import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

// check for Redis connection url
if (!process.env.REDIS_URL) {
	throw new Error("REDIS_URL env variable is not set");
}
if (!process.env.REDIS_TOKEN) {
	throw new Error("REDIS_TOKEN env variable is not set");
}

const redis = new Redis({
	url: process.env.REDIS_URL,
	token: process.env.REDIS_TOKEN,
});

if (redis) {
	console.log("Redis connected");
} else {
	console.log("Error: Redis unable to connect");
}

export const isRedisSetSuccessful = "OK";

export const redisGet = async (key, path) => {
	const JSONpath = path ? path : "$"; // get nested json data
	try {
		const res = await redis.json.get(key, JSONpath);
		return res;
	} catch (error) {
		console.log(`REDIS GET ERROR: ${err}`);
	}
};

export const redisSet = async (key, value, path) => {
	const expireAfterOneDayInSeconds = 86400; // 1 day in seconds
	const JSONpath = path ? path : "$"; // set nested json data
	try {
		const res = await redis.json.set(key, JSONpath, value, {
			ex: expireAfterOneDayInSeconds,
		});
		console.log(res);
		return res;
	} catch (err) {
		console.log(`REDIS SET ERROR: ${err}`);
	}
};
