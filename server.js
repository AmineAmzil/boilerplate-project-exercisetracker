const express = require("express");
const date_fns = require("date-fns");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./model");
require("dotenv").config();

("use strict");

const DB_LINK =
  process.env.DB_LINK ||
  "mongodb://127.0.0.1:27017/exerciseTracker?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.3.1";

async function main() {
  await mongoose.connect(DB_LINK);
}

main().catch((err) => {
  console.log("Problem while conecting to db");
  console.log({ err });
  process.exit();
});

app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//  GET ALL USERS

app.get(
  "/api/users",
  catchAsync(async (req, res) => {
    await User.find({}, { log: 0, count: 0 })
      .then((users) => {
        res.send(users);
      })
      .catch((error) => {
        res.send({
          error: error.message,
        });
      });
  }),
);

// ADD A USERS

app.post(
  "/api/users",
  catchAsync(async (req, res) => {
    const { username } = req.body;

    const user = new User({
      username: username,
    });

    user
      .save()
      .then((result) => {
        const { username, _id } = result;
        res.send({ username, _id });
      })
      .catch((err) => {
        res.send(err);
      });
  }),
);

// ADD EXERCISE

app.post(
  "/api/users/:_id/exercises",
  catchAsync(async (req, res) => {
    const _id = req.params._id;
    const { id, description, duration, date } = req.body;

    if (isNaN(duration)) {
      console.log("Bad duration");
      throw new Error("Duration should be a number representing the minutes.");
    }

    if (!checkDate(date)) {
      throw new Error("Wrong date format. Date format is yyyy-MM-dd");
    }

    if (!description) {
      throw new Error("Description is empty.");
    }

    const exercise = {
      description: description,
      duration: parseInt(duration),
      date: new Date(date),
    };

    const user = await User.findById(_id);

    user.log.push(exercise);
    user.count++;

    user
      .save()
      .then((updated) => {
        exercise._id = updated._id;
        exercise.username = updated.username;
        exercise.date = exercise.date.toDateString();
        res.send(exercise);
      })
      .catch((err) => {
        next(new Error(err.message));
      });
  }),
);

app.get(
  "/api/users/:_id/logs",
  catchAsync(async (req, res) => {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    User.findById(_id)
      .then((user) => {
        const logs = user.log
          .filter(
            function (e) {
              if (fromHelper(e.date, from) && toHelper(e.date, to) && limitHelper(this.c, limit)) {
                this.c++;
                return true;
              }
              return false;
            },
            { c: 0 },
          )
          .map((e) => {
            return {
              description: e.description,
              duration: e.duration,
              date: e.date.toDateString(),
            };
          });

        const response = {
          username: user.username,
          count: user.log.length,
          _id: user._id,
          log: logs,
        };

        res.json(response);
      })
      .catch((error) => {
        res.json({
          error: error.message,
        });
      });
  }),
);

function checkDate(date) {
  if (!date) {
    return false;
  }

  if (!date_fns.isMatch(date, "yyyy-MM-dd")) {
    return false;
  }

  if (!date_fns.isValid(new Date(date))) {
    return false;
  }

  return true;
}

function fromHelper(date, from) {
  if (checkDate(from)) {
    const r = date_fns.compareAsc(date, new Date(from));
    return r >= 0;
  }
  return true;
}

function toHelper(date, to) {
  if (checkDate(to)) {
    const r = date_fns.compareAsc(date, new Date(to));
    return r <= 0;
  }
  return true;
}

function limitHelper(count, limit) {
  if (isNaN(limit)) {
    return true;
  }
  return count < limit;
}

function catchAsync(fun) {
  return (req, res, next) => {
    fun(req, res, next).catch((e) => next(e));
  };
}

app.use((err, req, res, next) => {
  // console.error(err.stack);
  res.status(500).send(err.message);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
