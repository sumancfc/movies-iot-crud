import express, { Application, Request, Response } from "express";
import { MongoClient, ObjectId, Collection } from "mongodb";
import dotenv from "dotenv"
import axios from "axios";
dotenv.config();

const app: Application = express();
const port: number = Number(process.env.PORT) || 8000;
const uri: string = process.env.URL || "";

interface Movie {
  name: string;
  director: string;
  actor: string;
  actress: string;
  genre: string;
  year: number;
}

const client: MongoClient = new MongoClient(uri);
//connect to database
async function connection(): Promise<void> {
  try {
    await client.connect();
    console.log("Connected to mongodb database");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

app.use(express.json());

const movies: Collection<Movie> = client.db("movie").collection("movies");

app.get("/", (req: Request, res: Response) => {
  res.send({
    "GET /movies": "Get all movies",
    "POST /movie/add": "Add a new movie",
    "GET /movie/:id": "Get a specific movie",
    "PUT /movie/:id": "Update a specific movie",
    "DELETE /movie/:id": "Delete a specific movie",
  });
});

app.get("/date", async (req: Request, res: Response) => {
  const currentDate = new Date();
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(currentDate.toDateString());
});

app.get("/time", async (req: Request, res: Response) => {
  const currentDateTime = new Date();
  const hour = currentDateTime.getHours();
  const minute = currentDateTime.getMinutes();

  const time = `${hour}:${minute}`;

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(time);
});

app.get("/sunrise", async (req: Request, res: Response) => {
  const { data } = await axios.get<{ results: { sunrise: string } }>(
    "https://api.sunrise-sunset.org/json?lat=50.3135&lng=11.9128"
  );

  res.status(200).send(data.results.sunrise);
});

app.get("/sunset", async (req: Request, res: Response) => {
  const { data } = await axios.get<{ results: { sunset: string } }>(
    "https://api.sunrise-sunset.org/json?lat=50.3135&lng=11.9128"
  );

  res.status(200).send(data.results.sunset);
});

app.get("/outside-temperature", async (req: Request, res: Response) => {
  const { data } = await axios.get<{ main: { temp: number } }>(
    `https://api.openweathermap.org/data/2.5/weather?lat=50.3135&lon=11.9128&appid=${process.env.APP_ID}`
  );
  res.status(200).json(Math.ceil(data.main.temp)-273);
});

// get all the movies
// method: GET
app.get("/movies", async (req: Request, res: Response) => {
  const allMoviesList = await movies.find().toArray();

  res.status(200).json(allMoviesList);
});

// add movie in the list
// method: POST
app.post("/movie/add", async (req: Request, res: Response) => {
  const { name, director, actor, actress, genre, year }: Movie = req.body;

  const result = await movies.insertOne({
    name,
    actor,
    actress,
    director,
    genre,
    year,
  });

  if (result.insertedId) {
    const insertedMovie = {
      _id: result.insertedId,
      name,
      director,
      actor,
      actress,
      genre,
      year,
    };

    res.status(201).json({ message: "New movie has been created", movie: insertedMovie });
  } else {
    res.status(500).json({ message: "Movie creation failed" });
  }
});

//get single movie by id
// method: GET
// @ts-ignore
app.get("/movie/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movie = await movies.findOne({ _id: new ObjectId(id) });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.status(200).json(movie);
  } catch (error) {
    errorHandling("Error getting movie:", res, error);
  }
});

// update movie using id
// method: PUT
//@ts-ignore
app.put("/movie/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateMovie: Partial<Movie> = req.body;

    const movie = await movies.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateMovie }
    );

    if (movie.modifiedCount === 0) {
      return res.status(404).json({ message: "Movie not found or not updated" });
    }

    res.status(200).json({ message: "Movie has been updated.", movie });
  } catch (error) {
    errorHandling("Error updating movie:", res, error);
  }
});

// delete movie using id
// method: DELETE
//@ts-ignore
app.delete("/movie/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await movies.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.status(200).json({ message: "Movie has been deleted." });
  } catch (error) {
    errorHandling("Error deleting movie:", res, error);
  }
});

export const errorHandling = (message: string, res:Response, error: unknown ) => {
  if (error instanceof Error && error.name === 'BSONError') {
    return res.status(400).json({ message: "Invalid movie ID" });
  }
  console.error(`${message}`, error);
  return res.status(500).json({ message: "Internal server error" });
}

// run the server
connection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://127.0.0.1:${port}/`);
    });
  })
  .catch((err) => {
    console.error("Error starting server:", err);
  });
