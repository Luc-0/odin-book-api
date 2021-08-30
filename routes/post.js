const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.createPost);

router.get('/:postId', postController.getPost);
router.put('/:postId', postController.updatePost);

module.exports = router;
