// Database scheme for a device code for TV device authorization

const mongoose = require("mongoose");

const deviceCodeSchema = new mongoose.Schema({
  deviceCode: { type: String, unique: true },
  userCode: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expiresAt: { type: Date },
  confirmedAt: { type: Date },
});

module.exports = mongoose.model("DeviceCode", deviceCodeSchema);
