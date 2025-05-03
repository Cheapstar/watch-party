export class RedisNotInitialized extends Error {
    constructor() {
        super(`Redis client is not initialized`);
        this.name = "RedisNotInitialized";
    }
}
export class RedisOperationFailed extends Error {
    constructor(message) {
        super(`Redis client is not initialized, ${message}`);
        this.name = "RedisNotInitialized";
    }
}
export default class RedisService {
    constructor(redisClient) {
        this.getKey = {
            rooms: () => `rooms`,
            members: (roomId) => `members:${roomId}`,
            messages: (roomId) => `messages:${roomId}`,
        };
        this.getClient = () => {
            if (!this.redisClient)
                throw new RedisNotInitialized();
            return this.redisClient;
        };
        this.redisClient = redisClient;
    }
}
