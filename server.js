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
const Collection = require("./models/Collection");
const Link = require("./models/Link");

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

app.get("/api/collections", async (req, res) => {
  const collections = await Collection.find({
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
  }).populate("linkIds");
  const result = collections.map((col) => ({
    _id: col._id,
    name: col.name,
    links: col.linkIds,
    isOwner: col.owner.equals(req.user._id),
  }));
  res.json(result);
});

app.post("/api/collections", async (req, res) => {
  const { name } = req.body;
  const collection = new Collection({ name, owner: req.user._id });
  await collection.save();
  res.status(201).json(collection);
});

app.delete("/api/collections/:id", async (req, res) => {
  const collection = await Collection.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!collection) {
    return res.status(404).json({ error: "Collection not found or not owner" });
  }
  const linkIds = collection.linkIds.map((id) => id.toString());
  await collection.deleteOne();
  for (const linkId of linkIds) {
    const usedElsewhere = await Collection.exists({ linkIds: linkId });
    if (!usedElsewhere) {
      await Link.findByIdAndDelete(linkId);
    }
  }
  res.sendStatus(204);
});

app.put("/api/collections/:id/name", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { name },
    { new: true }
  );
  if (!collection) {
    return res.status(404).json({ error: "Collection not found or not owner" });
  }
  res.json({ _id: collection._id, name: collection.name });
});

app.post("/api/collections/join/:shareId", async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    {
      shareId: req.params.shareId,
      sharedWith: { $ne: req.user._id },
      owner: { $ne: req.user._id },
    },
    { $push: { sharedWith: req.user._id } },
    { new: true }
  );
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or already joined/owned" });
  }
  res.json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: false,
    shareId: collection.shareId,
  });
});

app.post("/api/collections/:id/leave", async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, sharedWith: req.user._id },
    { $pull: { sharedWith: req.user._id } },
    { new: true }
  );
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or not shared with you" });
  }
  res.sendStatus(204);
});

// Add an existing link to another collection
app.post("/api/collections/:collectionId/links/:linkId", async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    {
      _id: req.params.collectionId,
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
      linkIds: { $ne: req.params.linkId },
    },
    { $push: { linkIds: req.params.linkId } },
    { new: true }
  ).populate("linkIds");
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or link already added" });
  }
  res.json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: collection.owner.equals(req.user._id),
    shareId: collection.shareId,
  });
});

const getFaviconUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;
  } catch {
    return "";
  }
};

// TODO bei allen CREATE, PUT, DELETE Routes überorüfen, ob die zurückgeschickte Antwort einheitlich ist. Vielleicht können wir auch ganz darauf verzichten und einfach nur bestätigen?

app.post("/api/collections/:collectionId/links", async (req, res) => {
  const { url, name } = req.body;
  if (!url || !name) {
    return res.status(400).json({ error: "url and name are required" });
  }
  const collection = await Collection.findOne({
    _id: req.params.collectionId,
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
  });
  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }
  const iconUrl = getFaviconUrl(url);
  const link = new Link({ url, name, icon: iconUrl });
  await link.save();
  collection.linkIds.push(link._id);
  await collection.save();
  await collection.populate("linkIds");
  res.status(201).json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: collection.owner.equals(req.user._id),
    shareId: collection.shareId,
  });
});

// TODO server.js ist sehr lang, es sollten einzelne Teile in eigene Dateien ausgelagert werden

app.post("/api/collections/:collectionId/links/:linkId", async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    {
      _id: req.params.collectionId,
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
      linkIds: { $ne: req.params.linkId },
    },
    { $push: { linkIds: req.params.linkId } },
    { new: true }
  ).populate("linkIds");
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or link already added" });
  }
  res.json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: collection.owner.equals(req.user._id),
    shareId: collection.shareId,
  });
});

app.delete("/api/collections/:collectionId/links/:linkId", async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    {
      _id: req.params.collectionId,
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
    },
    { $pull: { linkIds: req.params.linkId } },
    { new: true }
  );
  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }
  const usedElsewhere = await Collection.exists({ linkIds: req.params.linkId });
  if (!usedElsewhere) {
    await Link.findByIdAndDelete(req.params.linkId);
  }
  await collection.populate("linkIds");
  res.json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: collection.owner.equals(req.user._id),
    shareId: collection.shareId,
  });
});

app.put("/api/links/:linkId", async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }
  const icon = getFaviconUrl(url);
  const link = await Link.findByIdAndUpdate(
    req.params.linkId,
    { name, url, icon },
    { new: true }
  );
  res.json(link);
});

app.put("/api/account/email", async (req, res) => {
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

app.put("/api/account/password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old and new password required" });
  }
  const isValid = await req.user.validatePassword(oldPassword);
  if (!isValid) {
    return res.status(401).json({ error: "Old password incorrect" });
  }
  await req.user.setPassword(newPassword);
  await req.user.save();
  await DeviceCode.deleteMany({ userId: req.user._id });
});

app.delete("/api/account", async (req, res) => {
  const userId = req.user._id;
  await Collection.updateMany(
    { sharedWith: userId },
    { $pull: { sharedWith: userId } }
  );
  const ownedCollections = await Collection.find({ owner: userId });
  const allLinkIds = ownedCollections.reduce((acc, col) => {
    col.linkIds.forEach((id) => acc.add(id.toString()));
    return acc;
  }, new Set());
  await Collection.deleteMany({ owner: userId });
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

const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`ℹ️ API server is running on ${PORT}`);
});
