const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 50},
  username: { type: String, required: true, minLength: 3, maxLength: 50},
  password: { type: String, required: true, minLength: 6},
  createdAt: { type: Date, default: Date.now, immutable: true}
});

module.exports = mongoose.model('User', userSchema);