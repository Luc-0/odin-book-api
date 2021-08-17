const { isValidObjectId } = require('mongoose');
const User = require('../models/user');
const middlewares = require('../middlewares');

exports.addFriendRequest = [userIdManager('friend.requests', '$addToSet')];
exports.removeFriendRequest = [userIdManager('friend.requests', '$pull')];

exports.addFriend = [userIdManager('friend.list', '$addToSet')];
exports.removeFriend = [userIdManager('friend.list', '$pull')];

function userIdManager(arrField, dbOperation) {
  return [
    middlewares.verifyToken,
    middlewares.checkIdFormat('userId'),
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
