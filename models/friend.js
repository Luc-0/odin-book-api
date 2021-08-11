const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
  friends: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    default: [],
  },
  requests: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    default: [],
  }
})

module.exports = mongoose.model('Friend', friendSchema);