const mongoose = require("mongoose");
require("dotenv").config();

if (process.argv.length < 3) {
  console.log(
    "Please provide the password as an argument: node mongo.js <password>"
  );
  process.exit(1);
}

const password = process.argv[2];

const url = process.env.MONGODB_URI;

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

const Person = mongoose.model("Person", personSchema);

if (process.argv.length == 5) {
  mongoose
    .connect(url)
    .then((result) => {
      console.log("connected");

      const person = new Person({
        name: process.argv[3],
        number: process.argv[4],
      });

      return person.save();
    })
    .then((person) => {
      console.log(`added ${person.name} number ${person.number} to phonebook`);
      return mongoose.connection.close();
    })
    .catch((err) => console.log(err));
}

if (process.argv.length == 3) {
  mongoose
    .connect(url)
    .then((connection) => {
      console.log("Phonebook:");
      Person.find({}).then((person) => {
        person.forEach((result) => console.log(result));
        return mongoose.connection.close();
      });
    })
    .catch((err) => console.log(err));
}
