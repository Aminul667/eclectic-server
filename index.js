const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// JWT verification
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qbyf5is.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // start of the backend
    const usersCollection = client.db("eclecticDB").collection("users");
    const postsCollection = client.db("eclecticDB").collection("posts");
    const bookmarksCollection = client.db("eclecticDB").collection("bookmarks");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // create user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already existed" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // create all blog posts
    app.post("/posts", async (req, res) => {
      const post = req.body;
      const result = await postsCollection.insertOne(post);
      res.send(result);
    });

    // create bookmarked posts
    app.post("/bookmarks", async (req, res) => {
      const bookmarked = req.body;
      const result = await bookmarksCollection.insertOne(bookmarked);
      res.send(result);
    });

    // read blog posts data: verifyJWT
    app.get("/posts", async (req, res) => {
      const result = await postsCollection.find().toArray();
      res.send(result);
    });

    // read blog posts data by category
    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const search = req.query.search;

      if (id === "all") {
        const query = { title: { $regex: search, $options: "i" } };
        const result = await postsCollection
          .find(query)
          .sort({ $natural: -1 })
          .toArray();
        res.send(result);
      } else {
        const query = {
          category: id,
          title: { $regex: search, $options: "i" },
        };
        const result = await postsCollection
          .find(query)
          .sort({ $natural: -1 })
          .toArray();
        res.send(result);
      }
    });

    // blog post by user
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await postsCollection
        .find(query)
        .sort({ $natural: -1 })
        .toArray();
      res.send(result);
    });

    // single blog post data
    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.findOne(query);
      res.send(result);
    });

    // read bookmarked posts data
    app.get("/bookmarks", async (req, res) => {
      const result = await bookmarksCollection.find().toArray();
      res.send(result);
    });

    // bookmarked posts by a single user
    app.get("/bookmarks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { bookmarkedBy: email };
      const result = await bookmarksCollection
        .find(query)
        .sort({ $natural: -1 })
        .toArray();
      res.send(result);
    });

    // update a post
    app.patch("/users/posts/:id", async (req, res) => {
      const id = req.params.id;
      const updatedObject = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: updatedObject.title,
          category: updatedObject.category,
          lastUpdated: updatedObject.lastUpdated,
          post: updatedObject.post,
        },
      };
      const result = await postsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // delete a post, varify JWT, Admin
    app.delete("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    // delete a bookmarked article
    app.delete("/bookmark/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookmarksCollection.deleteOne(query);
      res.send(result);
    });

    // end of the backend

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// running server
app.get("/", (req, res) => {
  res.send("Eclectic is running");
});

app.listen(port, () => {
  console.log(`Eclectic is running on the port ${port}`);
});
