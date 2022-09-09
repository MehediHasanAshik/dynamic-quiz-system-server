const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const fileUpload = require("express-fileupload");
const { json } = require("express");

//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o1nca.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("dynamicQuiz");
    const usersCollection = database.collection("users");
    const quizzesCollection = database.collection("quizzes");
    const quizCollection = database.collection("quiz");
    console.log("connected successfully ");

    //get quizzes from database
    app.get("/quizzes", async (req, res) => {
      const category = req.query.category;
      const difficulty = req.query.difficulty;
      const query = { category: category, difficulty: difficulty };
      const cursor = quizzesCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    //get all
    app.get("/quiz", async (req, res) => {
      const cursor = quizCollection.find({});
      const quiz = await cursor.toArray();
      res.json(quiz);
    });

    //get All the User
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    //get true/false if Admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    //post user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    //update user via Google pop Up
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    //make an admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    //post a quiz question
    app.post("/quizzes", async (req, res) => {
      const pic = req.files?.image;
      const category = req.body.category;
      const difficulty = req.body.difficulty;
      const question = req.body.question;
      const correct_answer = req.body.correct_answer;
      const incorrect_answers = req.body.incorrect_answers;

      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imgBuffer = Buffer.from(encodedPic, "base64");
      const quizQues = {
        image: imgBuffer,
        category,
        difficulty,
        question,
        correct_answer,
        incorrect_answers,
      };
      console.log(quizQues);
      const result = await quizzesCollection.insertOne(quizQues);
      res.json(result);
    });
  } finally {
    // await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Quiz App is Running");
});

app.listen(port, () => {
  console.log("Quiz sever running at port", port);
});
