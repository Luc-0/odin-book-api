const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

router.get('/:userId/friends', userController.getUserFriends);
router.post('/:userId/friend', userController.addFriend);
router.delete('/:userId/friend', userController.removeFriend);

router.get('/:userId/friend/request', userController.getRequestList);
router.post('/:userId/friend/request', userController.addFriendRequest);
router.delete('/:userId/friend/request', userController.removeFriendRequest);

module.exports = router;
