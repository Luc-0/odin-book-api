const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const formValidationMiddlewares = [
  body('username').trim().escape().isLength({min: 3, max: 50}).withMessage('Username length needs to be in the range of 3-50 characters'),
  body('password').trim().escape().isLength({min: 6}).withMessage('Password length needs to be >= 6'),
  function (req, res, next) {
    const errorResult = validationResult(req);
    const hasError = !errorResult.isEmpty();

    if (hasError) {
      return res.status(400).json({
        msg: 'Invalid form input',
        errors: errorResult.errors,
      });
    }

    next();
  }
]

exports.signUp = [
  body('name').trim().escape().isLength({min: 3, max: 50}).withMessage('Name length needs to be in the range of 3-50 characters'),
  ...formValidationMiddlewares,
  (req, res, next) => {
    const formInput = {
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
    }

    User.findOne({username: formInput.username}, (err, user) => {

      if (err) {
        return next(err);
      }

      if (user) {
        return res.status(422).json({
          error: {
            msg: 'Username already in use',
            username: formInput.username,
          },
        });
      } 

      bcrypt.hash(formInput.password, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          return next(err);
        }

        const newUser = new User({
          ...formInput,
          password: hashedPassword,
        });

        newUser.save((saveErr, newUser) => {
          if (saveErr) {
            return next(saveErr);            
          }

          const { password, ...userWithoutPassword } = newUser._doc;

          return res.status(200).json({
            msg: 'User created',
            user: userWithoutPassword,
          })
        });
      })
    });
  }
]

exports.login = [
  ...formValidationMiddlewares,
  function (req, res, next) {
    const formInput = {
      username: req.body.username,
      password: req.body.password,
    }

    User.findOne({ username: formInput.username }, (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).json({
          msg: 'Invalid credentials'
        });
      }

      bcrypt.compare(formInput.password, user.password, (err, match) => {
        if (err) {
          return next(err);
        }

        if (!match) {
          return res.status(400).json({
            msg: 'Invalid credentials'
          });
        }
        
        jwt.sign({ user } , process.env.SECRET_JWT, { expiresIn: '8h'}, (err, token) => {
          if (err) {
            return next(err);
          }

          const { password, ...userWithoutPassword } = user._doc;

          return res.status(200).json({
            user: userWithoutPassword,
            token,
          });
        })
      })
    })
  }
];
