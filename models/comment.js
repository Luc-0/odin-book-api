const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true},
  text: { type: String, minLength: 3, maxLength: 300, required: true}
})

module.exports = mongoose.model('Comment', commentSchema);