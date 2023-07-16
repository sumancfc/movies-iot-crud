const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const axios = require("axios");

const app = express();
const port = process.env.PORT || 8000;
const uri = process.env.URL;

const client = new MongoClient(uri, { useUnifiedTopology: true });
//connect to database
async function connection() {
  try {
    await client.connect();
    console.log("Connected to mongodb database");
  } catch (err) {
    console.log(err);
  }
}

app.use(express.json());

const movies = client.db("movie").collection("movies");

app.get("/", (req, res) => {
  res.send({
    GET: "/movies",
    POST: "/movie/add",
    GET: "/movie/:id",
    PUT: "/movie/:id",
    DELETE: "/movie/:id",
  });
});

app.get("/date", async (req, res) => {
  const currentDate = new Date();
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(currentDate.toDateString());
});

app.get("/time", async (req, res) => {
  const currentDateTime = new Date();
  const hour = currentDateTime.getHours();
  const minute = currentDateTime.getMinutes();

  const time = `${hour}:${minute}`;

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(time);
});

app.get("/sunrise", async (req, res) => {
  const { data } = await axios.get(
    "https://api.sunrise-sunset.org/json?lat=50.3135&lng=11.9128"
  );

  res.status(200).send(data.results.sunrise);
});
app.get("/sunset", async (req, res) => {
  const { data } = await axios.get(
    "https://api.sunrise-sunset.org/json?lat=50.3135&lng=11.9128"
  );

  res.status(200).send(data.results.sunset);
});

app.get("/outside-temperature", async (req, res) => {
  const { data } = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather?lat=50.3135&lon=11.9128&appid=938c333ad5a8936d4e315ccdd459917a"
  );
  res.status(200).json(data.main.temp);
  // res.status(200).send(data.results.sunset);
});

// get all the movies
// method: GET
app.get("/movies", async (req, res) => {
  const allMoviesList = await movies.find().toArray();

  res.status(200).json(allMoviesList);
});

// add movie in the list
// method: POST
app.post("/movie/add", async (req, res) => {
  const { name, director, actor, actress, genre, year } = req.body;

  const movie = await movies.insertOne({
    name,
    actor,
    actress,
    director,
    genre,
    year,
  });

  res.status(201).json({ message: "New movie has been created", movie });
});

//get single movie by id
// method: GET
app.get("/movie/:id", async (req, res) => {
  const { id } = req.params;

  const movie = await movies.findOne({ _id: new ObjectId(id) });
  res.status(200).json(movie);
});

// update movie using id
// method: PUT
app.put("/movie/:id", async (req, res) => {
  const { id } = req.params;
  const updateMovie = req.body;

  const movie = await movies.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateMovie }
  );

  res.status(200).json({ message: "Movie has been updated.", movie });
});

// delete movie using id
// method: DELETE
app.delete("/movie/:id", async (req, res) => {
  const { id } = req.params;

  await movies.deleteOne({ _id: new ObjectId(id) });
  res.status(200).json("Movie has been deleted.");
});

// run the server
connection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://127.0.0.1:${port}/`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
