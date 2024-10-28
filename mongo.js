const mongoose = require('mongoose');

if (process.argv.length < 3) {
  console.log('give password as argument');
  process.exit(1);
}

const password = process.argv[2];
const url = `mongodb+srv://chocolate:${password}@cluster0.1focl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.set('strictQuery', false);
mongoose.connect(url);

const noteSchema = new mongoose.Schema({
  content: String,
  number: String,
  important: Boolean,
});
const Note = mongoose.model('Note', noteSchema);

if (process.argv.length === 3) {
  Note.find({}).then((result) => {
    result.forEach((note) => {
      console.log(note);
    });
    mongoose.connection.close();
  });
}

if (process.argv.length === 5) {
  const note = new Note({
    content: process.argv[3],
    number: process.argv[4],
    important: true,
  });

  note.save().then((result) => {
    console.log('note saved!');
    mongoose.connection.close();
  });
}
