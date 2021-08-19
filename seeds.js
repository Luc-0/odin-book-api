const faker = require('faker');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

const User = require('./models/user');

// addUsers(30);

async function addUsers(num) {
  for (let i = 0; i < num; i++) {
    const username = faker.internet.userName();
    const password = faker.internet.password();
    const name = faker.name.findName();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await new User({
      username,
      password: hashedPassword,
      name,
    }).save();
    console.log('User added: ', newUser);
  }
  db.close();
}
