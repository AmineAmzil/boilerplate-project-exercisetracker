const mongoose = require("mongoose");
const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    description: {
      type: String,
    },
    duration: {
      type: Number,
    },
    date: {
      type: Date,
    },
  },
  { versionKey: false },
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    log: [exerciseSchema],
  },
  { versionKey: false },
);

const User = mongoose.model("User", userSchema);

exports.User = User;
