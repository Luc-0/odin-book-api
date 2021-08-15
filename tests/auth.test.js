const express = require('express');
const app = express();
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/user');
const authRouter = require('../routes/auth');

app.use(express.urlencoded({ extended: false }));
app.use('/auth', authRouter);

let db;

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error'));
  await addInitialUsers();
});

afterAll(async () => {
  await db.close();
});

describe('sign up', () => {
  const username = 'test';
  const password = '123123';
  const name = 'Test';

  test('sign up new user', (done) => {
    request(app)
      .post('/auth/signup')
      .type('form')
      .send({ username, password, name })
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  test('username already used', async () => {
    const usedUsername = 'used';
    await createUser(usedUsername, password, name);

    const req = await request(app)
      .post('/auth/signup')
      .type('form')
      .send({ username: usedUsername, password, name })
      .expect('Content-Type', /json/)
      .expect((res) => {
        if (res.body.error) {
          res.body.error = 'error';
        }
      })
      .expect(422, {
        error: 'error',
      });

    return Promise.resolve(req);
  });

  test('Invalid input', (done) => {
    request(app)
      .post('/auth/signup')
      .type('form')
      .send({ username: '12', password: 3234, name: 'lo' })
      .expect('Content-Type', /json/)
      .expect((res) => Array.isArray(res.body.errors))
      .expect((res) => {
        res.errorCount = res.body.errors.length;
      })
      .expect((res) => res.errorCount == 3)
      .expect(400, done);
  });
});

describe('login', () => {
  test('response from login', (done) => {
    request(app)
      .post('/auth/login')
      .type('form')
      .send({ username: 'luc', password: '123123' })
      .expect('Content-Type', /json/)
      .expect((res) => {
        if (res.body.user && res.body.token) {
          res.body.user = 'user';
          res.body.token = 'token';
        }
      })
      .expect(
        200,
        {
          user: 'user',
          token: 'token',
        },
        done
      );
  });

  test('Invalid login', (done) => {
    request(app)
      .post('/auth/login')
      .type('form')
      .send({ username: 'invalidusername', password: '123123' })
      .expect('Content-Type', /json/)
      .expect((res) => {
        if (res.body.msg) {
          res.body.msg = 'msg';
        }
      })
      .expect(
        400,
        {
          msg: 'msg',
        },
        done
      );
  });
});

async function addInitialUsers() {
  const usernames = ['luc', 'tester', 'testing'];
  const password = '123123';
  const name = 'luc';

  const hashedPassword = await bcrypt.hash(password, 10);

  for (i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    await createUser(username, hashedPassword, name);
  }
}

async function createUser(username, password, name) {
  const newUser = await new User({
    username,
    password,
    name,
  }).save();

  return newUser;
}
