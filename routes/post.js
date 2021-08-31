const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.createPost);

router.get('/:postId', postController.getPost);
router.put('/:postId', postController.updatePost);

router.post('/:postId/likes', postController.addLike);
router.delete('/:postId/likes', postController.removeLike);

module.exports = router;
