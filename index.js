const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const commentCollection = db.collection("comments");

    app.get("/ideas", async (req, res) => {
      const result = await ideaCollection.find().toArray();
      res.send(result);
    });

    app.get("/ideas/:id", async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format");
      }
      const result = await ideaCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/idea", async (req, res) => {
      const ideaData = req.body;
      const result = await ideaCollection.insertOne(ideaData);
      res.send(result);
    });

    app.get("/my-ideas/:uId", async (req, res) => {
      const { uId } = req.params;
      const result = await ideaCollection
        .find({
          userId: uId,
        })
        .toArray();
      res.send(result);
    });

    app.patch("/my-ideas/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const result = await ideaCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.send(result);
    });

    app.delete("/my-ideas/:id", async (req, res) => {
      const id = req.params;
      const result = await ideaCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/comment", async (req, res) => {
      const commentData = req.body;
      console.log(commentData);
      const result = await commentCollection.insertOne(commentData);
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
