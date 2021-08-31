const Post = require('../models/post');
const User = require('../models/user');

const { body, validationResult } = require('express-validator');
const { verifyToken, checkIdFormat } = require('../middlewares');

const postFormValidation = [
  body('text')
    .trim()
    .escape()
    .isLength({ min: 3, max: 300 })
    .withMessage('Text length must be in the range of 3-50 characters'),
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
  },
];

exports.createPost = [
  verifyToken,
  ...postFormValidation,
  (req, res, next) => {
    const userId = req.user._id;
    const postText = req.body.text;

    User.exists({ _id: userId }, (err, result) => {
      if (err) {
        return next(err);
      }

      if (!result) {
        return res.status(500).json({
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

exports.getPost = [
  verifyToken,
  checkIdFormat('postId'),
  (req, res, next) => {
    const { postId } = req.params;

    Post.findById(postId)
      .populate({
        path: 'user',
        select: '-friend -password',
        options: { lean: true },
      })
      .exec((err, post) => {
        if (err) {
          return next(err);
        }

        res.json({
          post,
        });
      });
  },
];

exports.updatePost = [
  verifyToken,
  checkIdFormat('postId'),
  ...postFormValidation,
  function (req, res, next) {
    const { postId } = req.params;
    const newPostText = req.body.text;
    const authUserId = req.user._id;

    Post.exists({ _id: postId }, (err, result) => {
      if (err) {
        return next(err);
      }

      if (!result) {
        return res.status(400).json({
          msg: 'Post does not exists',
        });
      }

      const query = { _id: postId, user: authUserId };
      const update = { text: newPostText };

      Post.findOneAndUpdate(
        query,
        update,
        { new: true },
        (err, updatedPost) => {
          if (err) {
            return next(err);
          }

          if (!updatedPost) {
            return res.status(403).json({
              msg: 'User does not have permission to change post',
            });
          }

          res.json({ post: updatedPost });
        }
      );
    });
  },
];

// Likes

exports.addLike = postLike(true);

exports.removeLike = postLike(false);

function postLike(addLike = true) {
  return [
    verifyToken,
    checkIdFormat('postId'),
    (req, res, next) => {
      const likeId = req.user._id;
      const { postId } = req.params;
      const operation = addLike ? '$addToSet' : '$pull';

      const update = {
        [operation]: {
          likes: likeId,
        },
      };

      Post.findByIdAndUpdate(
        postId,
        update,
        { select: 'likes', new: true },
        (err, updatedPostLikes) => {
          if (err) {
            return next(err);
          }

          console.log(updatedPostLikes);
          res.json({
            post: updatedPostLikes,
          });
        }
      );
    },
  ];
}
