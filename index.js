const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
var morgan = require("morgan");
const app = express();

const url = process.env.MONGODB_URI;

app.use(express.json());
morgan.token("req-body", (req, res) => {
  return JSON.stringify(req.body);
});
app.use(cors());
app.use(express.static("build"));
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :req-body"
  )
);

const phonebookEntrySchema = new mongoose.Schema({
  name: String,
  number: String,
});

phonebookEntrySchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Entries = mongoose.model("Phonebook", phonebookEntrySchema);

app.get("/api/persons", (request, response) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log("Connected to database");
      Entries.find({}).then((entry) => {
        response.json(entry);
        return mongoose.connection.close();
      });
    })
    .catch((err) => console.log(err));
});

app.get("/info", (request, response) => {
  mongoose
    .connect(url)
    .then(() => Entries.find({}).length)
    .then((length) => {
      response
        .send(
          `
  <p>Phonebook has info for ${length} people</p>
  <p>${new Date().toString()} </p>
  `
        )
        .then(() => mongoose.connection.close());
    })
    .catch((err) => console.log(err));
});

app.put("/api/persons/:id", (request, response) => {
  const updatedEntry = request.body;
  mongoose
    .connect(url)
    .then(() =>
      Entries.findByIdAndUpdate(request.params.id, updatedEntry, {
        new: true,
      })
        .then((updatedPerson) => response.json(updatedPerson))
        .then(() => mongoose.connection.close())
    )
    .catch((err) => {
      console.log(err);
      return next(err);
    });
});

app.get("/api/persons/:id", (request, response, next) => {
  const id = Number(request.params.id);
  mongoose
    .connect(url)
    .then(() => {
      Entries.find({ id: id })
        .then((person) => {
          if (person) {
            response.json(person);
          } else {
            response.status(404).end();
          }
        })
        .then(() => mongoose.connection.close());
    })
    .catch((err) => next(err));
});

app.delete("/api/persons/:id", (request, response, next) => {
  mongoose
    .connect(url)
    .then(() => {
      Entries.findByIdAndRemove(request.params.id)
        .then((result) => response.status(204).end())
        .then(() => mongoose.connection.close())
        .catch((error) => {
          console.log(err);
          response.status(400).send({ error: "malformatted id" });
        });
    })
    .catch((err) => console.log(err));
});

app.post("/api/persons/", (request, response) => {
  const newPerson = request.body;
  mongoose
    .connect(url)
    .then(() => {
      if (!newPerson.name || !newPerson.number) {
        throw response.status(400).json({
          error:
            "Name and number are mandatory fields. At least one is missing",
        });
      } else {
        /*
      else if (
        Entries.find({ name: newPerson.name }).includes(newPerson.name)
      ) {
        throw response.status(400).json({
          error: `Name ${newPerson.name} already exists in phonebook`,
        });
      }
    */
        const person = new Entries({
          name: newPerson.name,
          number: newPerson.number,
        });
        return person.save();
      }
    })
    .then(() => mongoose.connection.close())
    .then(() => response.status(200).end())
    .catch((err) => console.log(err));
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }

  next(error);
};

// this has to be the last loaded middleware.
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
