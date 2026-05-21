const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
dotenv.config();
const uri = process.env.MONGODB_URI;
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("ideaVault");
    const ideaCollection = db.collection("ideas");

    app.get("/ideas", async (req, res) => {
      const result = await ideaCollection.find().toArray();
      res.send(result);
    });

    app.post("/idea", async (req, res) => {
      const ideaData = req.body;
      console.log(ideaData);
      const result = await ideaCollection.insertOne(ideaData);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is working properly");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
