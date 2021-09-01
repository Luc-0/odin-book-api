const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/comment');

const { body, validationResult } = require('express-validator');
const { verifyToken, checkIdFormat } = require('../middlewares');
const async = require('async');

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
          msg: 'User does not exist',
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
          msg: 'Post does not exist',
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

// Comments

exports.getComments = [
  verifyToken,
  ...postCheck(),
  (req, res, next) => {
    const { postId } = req.params;
    const limit = +req.body.limit || 30;

    Comment.find({ post: postId })
      .limit(limit)
      .exec((err, comments) => {
        if (err) {
          return next(err);
        }

        res.json(comments);
      });
  },
];

exports.createComment = [
  ...postCommentValidation(),
  (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.user._id;
    const commentText = req.body.text;

    new Comment({
      post: postId,
      user: userId,
      text: commentText,
    }).save((err, newComment) => {
      if (err) {
        return next(err);
      }

      res.json(newComment);
    });
  },
];

function postCommentValidation() {
  return [
    verifyToken,
    ...postCheck(),
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
}

exports.updateComment = [
  ...postCommentValidation(),
  checkIdFormat('commentId'),
  (req, res, next) => {
    const commentId = req.params.commentId;

    Comment.findById(commentId)
      .select('user -_id')
      .lean()
      .exec((err, comment) => {
        if (err) {
          return next(err);
        }

        if (!comment) {
          return res.status(400).json({
            msg: 'Comment does not exist',
            commentId,
          });
        }

        const authUserId = req.user._id.toString();
        const commentUserId = comment.user.toString();

        if (authUserId !== commentUserId) {
          return res.status(403).json({
            msg: 'User does not have permission to update comment',
          });
        }

        const update = { text: req.body.text };

        Comment.findByIdAndUpdate(
          commentId,
          update,
          { new: true },
          (err, updatedComment) => {
            if (err) {
              return next(err);
            }

            if (!updatedComment) {
              return res.status(400).json({
                msg: 'Comment does not exist',
                commentId,
              });
            }

            res.json(updatedComment);
          }
        );
      });
  },
];

exports.deleteComment = [
  verifyToken,
  ...postCheck(),
  (req, res, next) => {
    const { postId, commentId } = req.params;
    const authUserId = req.user._id;

    async.parallel(
      {
        comment: function (cb) {
          Comment.findById(commentId).select('user -_id').lean().exec(cb);
        },
        post: function (cb) {
          Post.findById(postId).select('user -_id').lean().exec(cb);
        },
      },
      function (err, results) {
        if (err) {
          return next(err);
        }

        const { comment, post } = results;

        if (!comment) {
          return res.status(400).json({
            msg: 'Comment does not exist',
            commentId,
          });
        }

        const commentUserId = comment.user;
        const postUserId = post.user;

        if (
          authUserId.toString() !== commentUserId.toString() &&
          authUserId.toString() !== postUserId.toString()
        ) {
          return res.status(403).json({
            msg: 'User does not have permission to delete comment',
          });
        }

        Comment.findByIdAndDelete(commentId, (err, deletedComment) => {
          if (err) {
            return next(err);
          }

          res.json(deletedComment);
        });
      }
    );
  },
];

function postCheck() {
  return [
    checkIdFormat('postId'),
    (req, res, next) => {
      const postId = req.params.postId;

      Post.exists({ _id: postId }, (err, result) => {
        if (err) {
          return next(err);
        }

        if (!result) {
          return res.status(400).json({
            msg: 'Post does not exist',
            postId: postId,
          });
        }

        next();
      });
    },
  ];
}
