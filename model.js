const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  log: [],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
