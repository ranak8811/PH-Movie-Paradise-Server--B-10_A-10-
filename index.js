const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();

const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

//---------------------------------------------------------------- start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5yqq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    //------------------------------- CRUD Operations

    const userCollection = client.db("movieDB").collection("users");
    const movieCollection = client.db("movieDB").collection("movies");
    const favoriteCollection = client.db("movieDB").collection("favorites");

    //---------------------------- Movies related apis start

    app.get("/allMovies", async (req, res) => {
      const { searchParams } = req.query;
      let option = {};
      if (searchParams) {
        option = { title: { $regex: searchParams, $options: "i" } };
      }
      const cursor = movieCollection.find(option);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/genre/:genre", async (req, res) => {
      const genre = req.params.genre;
      const option = { genre: { $regex: new RegExp(genre, "i") } };
      const cursor = movieCollection.find(option);
      const result = await cursor.toArray();
      if (result.length > 0) {
        res.send(result);
      } else {
        res.send({ message: "No movies found in this genre." });
      }
    });

    app.get("/highRatedMovies", async (req, res) => {
      const cursor = movieCollection.find().sort({ rating: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/favoriteMovies", async (req, res) => {
      const userEmail = req.query.email;
      const query = { userEmail };
      // console.log(query);
      const cursor = favoriteCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allMovies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.findOne(query);
      res.send(result);
    });

    app.post("/movies", async (req, res) => {
      const newMovie = req.body;
      console.log("Adding new movie to db: ", newMovie);

      const result = await movieCollection.insertOne(newMovie);
      res.send(result);
    });

    app.post("/favoriteMovies", async (req, res) => {
      const favMovie = req.body;
      // console.log("Adding favorite movie to db: ", favMovie);

      const result = await favoriteCollection.insertOne(favMovie);
      res.send(result);
    });

    app.delete("/allMovies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/favoriteMovies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favoriteCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/updateMovie/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };

      const update = {
        $set: {
          posterURL: data.posterURL,
          title: data.title,
          genre: data.genre,
          duration: data.duration,
          releaseYear: data.releaseYear,
          rating: data.rating,
          summary: data.summary,
        },
      };

      const result = await movieCollection.updateOne(query, update);
      res.send(result);
    });

    //---------------------------- Movies related apis end

    //---------------------------- Users related apis start

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      // console.log("Adding new user to db: ", newUser);

      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.put("/users", async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;

      console.log("Checking for existing user with email: ", email);

      const filter = { email };
      const updateData = {
        name: newUser.name,
        createdAt: newUser.createdAt,
      };
      const options = { upsert: true };

      const result = await userCollection.updateOne(
        filter,
        { $set: updateData },
        options
      );

      if (result.upsertedCount > 0) {
        // console.log("New user created in the database.");
        res.send({ message: "New user created.", result });
      } else if (result.modifiedCount > 0) {
        // console.log("Existing user updated in the database.");
        res.send({ message: "Existing user updated.", result });
      } else {
        // console.log("No changes were made to the user.");
        res.send({ message: "No changes were made to the user.", result });
      }
    });

    //---------------------------- Users related apis end

    //------------------------------- CRUD Operations
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//---------------------------------------------------------------- end

app.get("/", (req, res) => {
  res.send("Movie server is running...");
});

app.listen(port, () => {
  console.log(`Movie server is listening on port ${port}`);
});
