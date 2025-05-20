require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const validator = require("validator");
const passport = require("passport");
const { v4: uuidv4 } = require("uuid");
require("./auth/passport");
const User = require("./models/User");
const DeviceCode = require("./models/DeviceCode");

const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT;
const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60 * 1000, // 3 months
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

db_uri = DB_HOST.replace(
  "<db_username>",
  encodeURIComponent(DB_USERNAME)
).replace("<db_password>", encodeURIComponent(DB_PASSWORD));
mongoose
  .connect(db_uri, {})
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// TODO maybe add email verification
app.post("/auth/register", async (req, res) => {
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

app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  res.sendStatus(200);
});

app.post("/auth/logout", (req, res) => {
  req.logout();
  res.sendStatus(200);
});

// URL to initiate a device authorization
app.post("/device/start", async (req, res) => {
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
app.get("/device/:userCode", async (req, res) => {
  const device = await DeviceCode.findOne({ userCode: req.params.userCode });
  if (!device || device.expiresAt < new Date()) {
    return res.status(400).send("Code expired or invalid");
  }
  res.sendFile(path.join(__dirname, "frontend/device-confirm.html")); //TODO confirmation and consent screen
});

// URL called after user confirms the device
app.post("/device/confirm", async (req, res) => {
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
app.post("/device/poll", async (req, res, next) => {
  const { device_code } = req.body;
  const device = await DeviceCode.findOne({ deviceCode: device_code });
  if (!device || device.expiresAt < new Date()) {
    return res.status(400).send("Invalid or expired code");
  }
  if (!device.userId) {
    return res.status(428).send("Authorization pending");
  }
  const user = await User.findById(device.userId);
  if (!user) return res.status(500).send("User not found");
  req.login(user, (err) => {
    if (err) return next(err);
    res.send("Device authenticated");
  });
});

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.sendStatus(401);
}

app.use("/api", ensureAuth);
app.get("/api", (req, res) => {
  res.send("Hello from API");
});

const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`ℹ️ API server is running on ${PORT}`);
});
