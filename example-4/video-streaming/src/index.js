const express = require("express");
const fs = require("fs");
const amqp = require('amqplib');

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const PORT = process.env.PORT;
const RABBIT = process.env.RABBIT;

//
// Send the "viewed" to the history microservice.
//
function sendViewedMessage(messageChannel, videoPath) {
    console.log(`Publishing message on "viewed" exchange.`);
        
    const msg = { videoPath: videoPath };
    const jsonMsg = JSON.stringify(msg);
    messageChannel.publish("viewed", "", Buffer.from(jsonMsg)); // Publish message to the "viewed" exchange.
}

//
// Application entry point.
//
async function main() {

    const messagingConnection = await amqp.connect(RABBIT); // Connect to the RabbitMQ server.

    const messageChannel = await messagingConnection.createChannel(); // Create a RabbitMQ messaging channel.

	await messageChannel.assertExchange("viewed", "fanout"); // Assert that we have a "viewed" exchange.

    const app = express();

    app.get("/video", async (req, res) => { // Route for streaming video.

        const videoPath = "./videos/SampleVideo_1280x720_1mb.mp4";
        const stats = await fs.promises.stat(videoPath);

        res.writeHead(200, {
            "Content-Length": stats.size,
            "Content-Type": "video/mp4",
        });
    
        fs.createReadStream(videoPath).pipe(res);

        sendViewedMessage(messageChannel, videoPath); // Send message to "history" microservice that this video has been "viewed".
    });

    app.listen(PORT, () => {
        console.log("Microservice online.")
    });
}

main()
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });