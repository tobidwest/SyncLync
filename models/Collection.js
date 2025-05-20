const mongoose = require("mongoose");
const { Schema } = mongoose;

const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    linkIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Link",
      },
    ],
    shareId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.pre("validate", function (next) {
  if (!this.shareId) {
    this.shareId = crypto.randomBytes(32).toString("hex");
  }
  next();
});

module.exports = mongoose.model("Collection", collectionSchema);
