import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import 'dotenv/config';


const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'consumer-client',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'sports-data-group' });


const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});


const run = async () => {
  try {
    await consumer.connect();
    console.log('Consumer connected to Kafka');
    
    redis.on('connect', () => {
        console.log('Consumer connected to Redis');
    });
    redis.on('error', (err) => {
        console.error('Redis connection error:', err);
    });

    await consumer.subscribe({ topic: 'sports-data', fromBeginning: true });
    console.log("Subscribed to topic: 'sports-data'");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        console.log(`Received message from topic: ${topic}`);
        const scoreData = JSON.parse(message.value.toString());

        const matchId = scoreData.id;


        await redis.set(`match:${matchId}`, JSON.stringify(scoreData));

        console.log(`Cached data for match ID: ${matchId}`);
     // NEW: Publish a message to the 'match-updates' channel
     // The message is the ID of the match that was just updated.
      await redis.publish('match-updates', matchId);
      console.log(`Published update for match ID: ${matchId} to 'match-updates' channel`);

},
    });

  } catch (error) {
    console.error('Error in consumer service:', error);
  }
};

run().catch(console.error);

const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERFM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
  process.on(type, async e => {
    try {
      console.log(`process.on ${type}`);
      console.error(e);
      await consumer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});

