// Routes for modifying the currently authenticated user's account

const express = require("express");
const validator = require("validator");
const User = require("../models/User");
const DeviceCode = require("../models/DeviceCode");
const Collection = require("../models/Collection");
const Link = require("../models/Link");

const router = express.Router();

// Update the logged in user's email
router.put("/email", async (req, res) => {
  if (!req.body || !req.body.newEmail) {
    return res.status(400).json({ error: "No new email specified" });
  }
  const { newEmail } = req.body;
  if (!newEmail || !validator.isEmail(newEmail)) {
    return res.status(400).json({ error: "Valid email required" });
  }
  const existing = await User.findOne({ username: newEmail });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }
  req.user.username = newEmail;
  await req.user.save();
  res.sendStatus(204);
});

// Change the user's password and invalidate device codes
router.put("/password", async (req, res) => {
  if (!req.body || !req.body.oldPassword || !req.body.newPassword) {
    return res.status(400).json({ error: "Old and new password required" });
  }
  const { oldPassword, newPassword } = req.body;
  if (oldPassword === newPassword) {
    return res
      .status(400)
      .json({ error: "New password must be different from old password" });
  }
  const isValid = await req.user.validatePassword(oldPassword);
  if (!isValid) {
    return res.status(401).json({ error: "Old password incorrect" });
  }
  await req.user.setPassword(newPassword);
  await req.user.save();
  await DeviceCode.deleteMany({ userId: req.user._id });
  req.logout(() => {
    res.sendStatus(204);
  });
});

// Delete the user account and all owned data
router.delete("/", async (req, res) => {
  const userId = req.user._id;
  await Collection.updateMany(
    { sharedWith: userId },
    { $pull: { sharedWith: userId } }
  );
  // Remove user from shared collections and gather all links from their
  // own collections so unused links can be deleted lateron
  const ownedCollections = await Collection.find({ owner: userId });
  const allLinkIds = ownedCollections.reduce((acc, col) => {
    col.linkIds.forEach((id) => acc.add(id.toString()));
    return acc;
  }, new Set());
  await Collection.deleteMany({ owner: userId });
  // Remove orphaned links that were only used by the deleted collections
  for (const linkId of allLinkIds) {
    const usedElsewhere = await Collection.exists({ linkIds: linkId });
    if (!usedElsewhere) {
      await Link.findByIdAndDelete(linkId);
    }
  }
  await User.findByIdAndDelete(userId);
  req.logout(() => {
    res.sendStatus(204);
  });
});

// Get the current user's account information
router.get("/", (req, res) => {
  const userInfo = {
    username: req.user.username,
    sorting: req.user.sorting,
  };
  res.json(userInfo);
});

// Update the user's sorting preference
router.put("/sorting", async (req, res) => {
  if (!req.body || typeof req.body.sorting === "undefined") {
    return res.status(400).json({ error: "No sorting preference specified" });
  }
  const { sorting } = req.body;
  const allowed = ["counter", "created", "alphabetically"];
  if (!allowed.includes(sorting)) {
    return res.status(400).json({ error: "Invalid sorting preference" });
  }
  req.user.sorting = sorting;
  await req.user.save();
  res.sendStatus(204);
});

module.exports = router;
