const mongoose = require("mongoose");
const { Schema } = mongoose;

const linkSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },
    lastAccessedAt: {
      type: Date,
      default: () => new Date(),
    },
    counter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt, might be useful for additional features
  }
);

module.exports = mongoose.model("Link", linkSchema);
