const { isValidObjectId } = require('mongoose');
const User = require('../models/user');
const { verifyToken, checkIdFormat } = require('../middlewares');

exports.getUserFriends = [
  verifyToken,
  checkIdFormat('userId'),
  (req, res, next) => {
    const userId = req.params.userId;

    User.findOne({ _id: userId })
      .populate({
        path: 'friend.list',
        select: '-friend -password',
        options: { lean: true },
      })
      .select('friend.list')
      .lean()
      .exec((err, result) => {
        if (err) {
          return next(err);
        }

        res.json({
          friends: result.friend.list,
        });
      });
  },
];

exports.getRequestList = [
  verifyToken,
  checkIdFormat('userId'),
  (req, res, next) => {
    const userId = req.params.userId;

    User.findOne({ _id: userId }, '-password', (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).json({ msg: 'User does not exists.' });
      }

      const notIn = [userId, ...user.friend.list, ...user.friend.requests];

      User.find(
        {
          _id: {
            $nin: notIn,
          },
        },
        '-friend -password',
        { lean: true },
        (err, users) => {
          if (err) {
            return next(err);
          }

          res.json({
            users,
          });
        }
      );
    });
  },
];

exports.addFriendRequest = [userIdManager('friend.requests', '$addToSet')];
exports.removeFriendRequest = [userIdManager('friend.requests', '$pull')];

exports.addFriend = [userIdManager('friend.list', '$addToSet')];
exports.removeFriend = [userIdManager('friend.list', '$pull')];

function userIdManager(arrField, dbOperation) {
  return [
    verifyToken,
    checkIdFormat('userId'),
    (req, res, next) => {
      const toUserId = req.params.userId;
      const id = req.body.id;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          msg: 'Invalid id',
          id: id,
        });
      }

      User.exists({ _id: id }).then((result) => {
        if (!result) {
          return res.status(400).json({
            msg: 'User id does not exists',
            id: id,
          });
        }

        User.findOneAndUpdate(
          { _id: toUserId },
          {
            [dbOperation]: {
              [arrField]: id,
            },
          },
          { new: true, lean: true, fields: '-password' },
          (err, updatedUser) => {
            if (err) {
              next(err);
            }

            if (!updatedUser) {
              return res.status(400).json({
                msg: 'User param id does not exists',
                id: toUserId,
              });
            }

            return res.json({ user: updatedUser });
          }
        );
      });
    },
  ];
}
