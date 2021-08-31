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
const Comment = require('./models/comment');

// addUsers(30);
// addPost(10, 5);
// addComment(10, 5, 3);

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

function addComment(userQty, postQty, commentQty) {
  User.find()
    .limit(userQty)
    .exec((err, users) => {
      if (err) {
        throw err;
      }

      Post.find()
        .limit(postQty)
        .exec((err, posts) => {
          // Post
          for (let postCounter = 0; postCounter < postQty; postCounter++) {
            // User
            for (let userCounter = 0; userCounter < userQty; userCounter++) {
              // Comment
              for (
                let commentCounter = 0;
                commentCounter < commentQty;
                commentCounter++
              ) {
                const post = posts[postCounter];
                const user = users[userCounter];
                const randomText = faker.lorem.sentence(
                  Math.floor(Math.random() * 3 + 1)
                );

                new Comment({
                  user: user._id,
                  post: post._id,
                  text: randomText,
                }).save((err, newComment) => {
                  if (err) {
                    throw err;
                  }
                  console.log('New comment: ', newComment);
                });
              }
            }
          }
        });
    });
}
