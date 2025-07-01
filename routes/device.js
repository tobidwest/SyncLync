// Routes implementing the device authorization flow
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const DeviceCode = require("../models/DeviceCode");
const User = require("../models/User");

// Public base URL of the application used in QR codes
const BASE_URL = process.env.BASE_URL;

const router = express.Router();

// URL to initiate a device authorization
router.post("/start", async (req, res) => {
  const deviceCode = uuidv4();
  const userCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await DeviceCode.create({ deviceCode, userCode, expiresAt });
  res.json({
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: `${BASE_URL}/device/${userCode}`,
    expires_in: 600,
  });
});

// URL encoded in the QR code where the user confirms the device authorization
router.get("/:userCode", async (req, res) => {
  const device = await DeviceCode.findOne({ userCode: req.params.userCode });
  if (!device || device.expiresAt < new Date()) {
    return res.status(400).send("Code expired or invalid");
  }
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// URL called after user confirms the device
router.post("/confirm", async (req, res) => {
  if (!req.body || !req.body.userCode) {
    return res.status(400).send("userCode is required");
  }
  const { userCode } = req.body;
  if (!req.user) return res.status(401).send("Login required");

  const device = await DeviceCode.findOne({ userCode });
  if (!device || device.expiresAt < new Date()) {
    return res.status(400).send("Code expired or invalid");
  }
  device.userId = req.user._id;
  device.confirmedAt = new Date();
  await device.save();
  res.send("Device linked");
});

// URL for device to poll for authentication status
router.post("/poll", async (req, res, next) => {
  if (!req.body || !req.body.device_code) {
    return res.status(400).send("device_code is required");
  }
  const { device_code } = req.body;
  const device = await DeviceCode.findOne({ deviceCode: device_code });
  if (!device || device.expiresAt < new Date()) {
    return res.status(400).send("Invalid or expired code");
  }
  if (!device.userId) {
    return res.status(202).send("Authorization pending");
  }
  const user = await User.findById(device.userId);
  if (!user) return res.status(500).send("User not found");
  req.login(user, (err) => {
    if (err) return next(err);
    res.send("Device authenticated");
  });
});

module.exports = router;
