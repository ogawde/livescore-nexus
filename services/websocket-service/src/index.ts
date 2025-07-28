import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';
import 'dotenv/config';

const PORT = parseInt(process.env.PORT || '8080');

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server started on port ${PORT}`);

// Redis Caching (GET)
const redisCache = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Redis (Pub/Sub)

const redisSubscriber = redisCache.duplicate();

console.log('Connecting to Redis...');

redisSubscriber.on('connect', () => console.log('Redis subscriber connected.'));
redisCache.on('connect', () => console.log('Redis cache client connected.'));
redisSubscriber.on('error', (err) => console.error('Redis subscriber error:', err));
redisCache.on('error', (err) => console.error('Redis cache error:', err));


// helper func
const broadcast = (message: string) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

wss.on('connection', ws => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('error', console.error);
});



const startSubscriber = async () => {
  await redisSubscriber.subscribe('match-updates');

  redisSubscriber.on('message', async (channel, matchId) => {
    console.log(`${channel}: ${matchId}`);

    try {
      const matchData = await redisCache.get(`match:${matchId}`);

      if (matchData) {
        console.log(`Broadcasting update for match ID: ${matchId}`);
        broadcast(matchData);
      }
    } catch (error) {
      console.error(`Error fetching/broadcasting data for match ${matchId}:`, error);
    }
  });
};

startSubscriber().catch(console.error);
