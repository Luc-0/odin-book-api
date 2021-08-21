const Post = require('../models/post');
const User = require('../models/user');

const { isValidObjectId } = require('mongoose');
const { verifyToken } = require('../middlewares');

exports.createPost = [
  verifyToken,
  (req, res, next) => {
    const userId = req.body.userId;
    const postText = req.body.text;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        msg: 'Invalid user id',
        userId,
      });
    }

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        msg: 'Invalid permission',
      });
    }

    User.exists({ _id: userId }, (err, result) => {
      if (err) {
        return next(err);
      }

      if (!result) {
        return res.status(400).json({
          msg: 'User does not exists',
          userId,
        });
      }

      new Post({
        user: userId,
        text: postText,
      }).save((err, post) => {
        if (err) {
          return next(err);
        }

        res.json({ post });
      });
    });
  },
];
