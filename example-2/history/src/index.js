const express = require("express");
const mongodb = require("mongodb");

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.DBHOST) {
    throw new Error("Please specify the database host using environment variable DBHOST.");
}

if (!process.env.DBNAME) {
    throw new Error("Please specify the name of the database using environment variable DBNAME");
}

const PORT = process.env.PORT;
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

//
// Application entry point.
//
async function main() {

    const app = express();

    //
    // Enables JSON body parsing for HTTP requests.
    //
    app.use(express.json()); 

    //
    // Connects to the database server.
    //
    const client = await mongodb.MongoClient.connect(DBHOST);

    //
    // Gets the database for this microservice.
    //
    const db  = client.db(DBNAME);

	//
    // Gets the collection for storing video viewing history.
    //
    const historyCollection = db.collection("history");

    //
    // Handles HTTP POST request to /viewed.
    //
    app.post("/viewed", async (req, res) => { // Handle the "viewed" message via HTTP POST request.
        const videoPath = req.body.videoPath; // Read JSON body from HTTP request.
        await historyCollection.insertOne({ videoPath: videoPath }) // Record the "view" in the database.

        console.log(`Added video ${videoPath} to history.`);
        res.sendStatus(200);
    });

    //
    // HTTP GET route to retrieve video viewing history.
    //
    app.get("/history", async (req, res) => {
        const skip = parseInt(req.query.skip);
        const limit = parseInt(req.query.limit);
        const history = await historyCollection.find()
            .skip(skip)
            .limit(limit)
            .toArray();
        res.json({ history });
    });

    //
    // Starts the HTTP server.
    //
    app.listen(PORT, () => {
        console.log("Microservice online.");
    });
}

main()
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });