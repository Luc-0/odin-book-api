const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
  text: { type: String, minLength: 3, maxLength: 300, required: true},
  likes: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    default: [],
  },
})

module.exports = mongoose.model('Post', postSchema);