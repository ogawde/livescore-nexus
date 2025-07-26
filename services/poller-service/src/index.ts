import { Kafka, Producer } from 'kafkajs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


const kafkaBrokers = process.env.KAFKA_BROKERS;
const kafkaClientId = process.env.KAFKA_CLIENT_ID;
const kafkaTopic = process.env.KAFKA_TOPIC;

const apiUrl = process.env.API_URL;
const pollInterval = process.env.POLL_INTERVAL_MS;

if (!kafkaBrokers || !kafkaClientId || !kafkaTopic || !apiUrl || !pollInterval) {
    console.error("One or more environment variables are not set. Exiting.");
    process.exit(1);
}

const kafka = new Kafka({
    clientId: kafkaClientId,  
    brokers: kafkaBrokers.split(','), 
});

const producer: Producer = kafka.producer();

let lastData: string | null = null; 

const pollApiAndPublish = async () => {
    try {
        console.log("Fetching data from API...");
        const response = await axios.get(apiUrl); 
        const currentData = JSON.stringify(response.data);

        if (currentData !== lastData) {
            console.log("Data has changed. Publishing to Kafka topic:", kafkaTopic);
            
            await producer.send({  
                topic: kafkaTopic,
                messages: [
                    { value: currentData },
                ],
            });
            lastData = currentData; 
        } else {
            console.log("Data has not changed. Skipping publish.");
        }
    } catch (error) {
        console.error("Error fetching data or publishing to Kafka:", error);
    }
};

const run = async () => {
    try {
        await producer.connect(); 
        console.log("Kafka Producer connected.");
        
        pollApiAndPublish(); 
        setInterval(pollApiAndPublish, parseInt(pollInterval)); 

    } catch (error) {
        console.error("Failed to start the poller service:", error);
        process.exit(1);
    }
};

run();

const gracefulShutdown = async () => {
    console.log("Shutting down producer...");
    await producer.disconnect();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);