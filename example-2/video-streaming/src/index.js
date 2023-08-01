const express = require("express");
const fs = require("fs");
const http = require("http");

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

const PORT = process.env.PORT;

//
// Send the "viewed" to the history microservice.
//
function sendViewedMessage(videoPath) {
    const postOptions = { // Options to the HTTP POST request.
        method: "POST", // Sets the request method as POST.
        headers: {
            "Content-Type": "application/json", // Sets the content type for the request's body.
        },
    };

    const requestBody = { // Body of the HTTP POST request.
        videoPath: videoPath 
    };

    const req = http.request( // Send the "viewed" message to the history microservice.
        "http://history/viewed",
        postOptions
    );

    req.on("close", () => {
        console.log("Sent 'viewed' message to history microservice.");
    });

    req.on("error", (err) => {
        console.error("Failed to send 'viewed' message!");
        console.error(err && err.stack || err);
    });

    req.write(JSON.stringify(requestBody)); // Write the body to the request.
    req.end(); // End the request.
}

//
// Application entry point.
//
async function main() {

    const app = express();

    app.get("/video", async (req, res) => { // Route for streaming video.

        const videoPath = "./videos/SampleVideo_1280x720_1mb.mp4";
        const stats = await fs.promises.stat(videoPath);

        res.writeHead(200, {
            "Content-Length": stats.size,
            "Content-Type": "video/mp4",
        });
    
        fs.createReadStream(videoPath).pipe(res);

        sendViewedMessage(videoPath); // Sends the "viewed" message to indicate this video has been watched.
    });

    app.listen(PORT, () => {
        console.log("Microservice online.");
    });
}

main()
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });