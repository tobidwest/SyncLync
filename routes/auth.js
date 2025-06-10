// User authentication routes (register, login, logout)
const express = require("express");
const validator = require("validator");
const passport = require("passport");
const User = require("../models/User");


const router = express.Router();

// Create a new account
router.post("/register", async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }
  const { username, password } = req.body;

  if (!validator.isEmail(username)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ error: "User already exists" });
  }

  const user = new User({ username });
  await user.setPassword(password);
  await user.save();

  res.sendStatus(201);
});

// Authenticate using username and password
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.sendStatus(200);
});

// End the session for the current user
router.post("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.sendStatus(200);
  });
});

module.exports = router;
