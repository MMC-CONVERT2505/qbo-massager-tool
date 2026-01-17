const mongoose = require("mongoose");

const qboRawDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },

    realmId: {
      type: String,
      required: true,
    },

    module: {
      type: String,
      required: true,
      index: true,
    },

    qboId: {
      type: String,
      required: true,
      index: true,
    },

    raw: {
      type: Object,
      required: true,
    },

    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// prevent duplicate records
qboRawDataSchema.index(
  { userId: 1, fileId: 1, realmId: 1, module: 1, qboId: 1 },
  { unique: true }
);

module.exports = mongoose.model("QboRawData", qboRawDataSchema);
