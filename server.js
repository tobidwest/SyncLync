require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
require("./auth/passport");

const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/device");
const collectionRoutes = require("./routes/collections");
const accountRoutes = require("./routes/account");
const ensureAuth = require("./middlewares/ensureAuth");

const PORT = process.env.PORT;
const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const db_uri = DB_HOST.replace(
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

app.use("/auth", authRoutes);
app.use("/device", deviceRoutes);
app.use("/api", ensureAuth);
app.use("/api", collectionRoutes);
app.use("/api/account", accountRoutes);

const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`ℹ️ API server is running on ${PORT}`);
});
