const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 50 },
  username: { type: String, required: true, minLength: 3, maxLength: 50 },
  password: { type: String, required: true, minLength: 6 },
  createdAt: { type: Date, default: Date.now, immutable: true },
  friend: {
    list: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    requests: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
});

module.exports = mongoose.model('User', userSchema);
