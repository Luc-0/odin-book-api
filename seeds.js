const faker = require('faker');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

const User = require('./models/user');
const Post = require('./models/post');

// addUsers(30);
// addPost(10, 5);

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

function addPost(userQty, postQty) {
  User.find()
    .limit(userQty)
    .exec(async (err, users) => {
      if (err) {
        throw err;
      }

      for (let i = 0; i < users.length; i++) {
        const currUser = users[i];

        for (let j = 0; j < postQty; j++) {
          const text = faker.lorem.sentences(3);

          const newPost = await new Post({
            user: currUser._id,
            text,
          }).save();

          console.log('New post:', newPost);
        }
      }
    });
}
