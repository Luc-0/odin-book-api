const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.createPost);

router.get('/:postId', postController.getPost);
router.put('/:postId', postController.updatePost);

router.post('/:postId/likes', postController.addLike);
router.delete('/:postId/likes', postController.removeLike);

router.get('/:postId/comments', postController.getComments);
router.post('/:postId/comments', postController.createComment);
router.put('/:postId/comments/:commentId', postController.updateComment);
router.delete('/:postId/comments/:commentId', postController.deleteComment);

module.exports = router;
