const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

router.post('/:userId/friend', userController.addFriend);
router.delete('/:userId/friend', userController.removeFriend);

router.post('/:userId/friend/request', userController.addFriendRequest);
router.delete('/:userId/friend/request', userController.removeFriendRequest);

module.exports = router;
