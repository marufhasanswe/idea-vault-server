const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("ideaVault");
    const ideaCollection = db.collection("ideas");
    const commentCollection = db.collection("comments");
    const userCollection = db.collection("user");

    app.get("/ideas", async (req, res) => {
      const result = await ideaCollection.find().toArray();
      res.send(result);
    });

    app.get("/trending-ideas", async (req, res) => {
      const result = await ideaCollection
        .aggregate([
          {
            $limit: 6,
          },
        ])
        .toArray();

      res.send(result);
    });

    app.get("/ideas/:id", verifyToken, async (req, res) => {
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

    app.get("/my-ideas/:uId", verifyToken, async (req, res) => {
      const { uId } = req.params;
      const result = await ideaCollection
        .find({
          userId: uId,
        })
        .toArray();
      res.send(result);
    });

    app.patch("/my-ideas/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const result = await ideaCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.send(result);
    });

    app.delete("/my-ideas/:id", verifyToken, async (req, res) => {
      const id = req.params;
      const result = await ideaCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/comment/:ideaId", verifyToken, async (req, res) => {
      const { ideaId } = req.params;
      const result = await commentCollection.find({ ideaId: ideaId }).toArray();

      res.send(result);
    });

    app.get("/my-interactions/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      console.log(userId);
      const result = await commentCollection.find({ userId: userId }).toArray();
      console.log(result);
      res.send(result);
    });

    app.post("/comment", verifyToken, async (req, res) => {
      const commentData = req.body;
      console.log(commentData);
      const result = await commentCollection.insertOne(commentData);
      res.send(result);
    });

    app.patch("/comment/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedCommentData = req.body;
      console.log(id, updatedCommentData);
      const result = await commentCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            comment: updatedCommentData.comment,
            updatedAt: new Date(),
          },
        },
      );
      res.send(result);
    });

    app.delete("/comment/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await commentCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.patch("/users/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        delete updatedData._id;
        delete updatedData.email;

        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: updatedData,
          },
        );

        res.send({
          success: true,
          message: "Profile updated successfully",
          result,
        });
      } catch (error) {
        console.log(error);

        res.status(500).send({
          success: false,
          message: "Failed to update profile",
        });
      }
    });

    // await client.db("admin").command({ ping: 1 });
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
