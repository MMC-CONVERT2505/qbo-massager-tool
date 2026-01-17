const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: { type: String, required: true },
    destinationRegion: { type: String, required: true },

    qbo: {
      isConnected: { type: Boolean, default: false },
      realmId: String,
      accessToken: String,
      refreshToken: String,
      companyName: String,
      tokenExpiry: Date,
      connectedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
