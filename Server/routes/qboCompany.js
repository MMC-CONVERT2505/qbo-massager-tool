const express = require("express");
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");
const axios = require("axios");
const { getValidQboAccessToken } = require("../utils/qboTokenManager");

const router = express.Router();

/* GET QBO COMPANY INFO */
router.get("/company/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.fileId,
      userId: req.userId,
    });

    if (!file || !file.qbo?.isConnected) {
      return res.status(400).json({ message: "QBO not connected" });
    }

    // 🔑 AUTO-REFRESH SAFE TOKEN
    const accessToken = await getValidQboAccessToken(file._id);

    const baseUrl =
      process.env.QBO_ENVIRONMENT === "sandbox"
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";

    const response = await axios.get(
      `${baseUrl}/v3/company/${file.qbo.realmId}/companyinfo/${file.qbo.realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const companyName =
      response.data.CompanyInfo?.CompanyName || "Unknown Company";

    // 💾 DB Update
    await File.findByIdAndUpdate(file._id, {
      "qbo.companyName": companyName,
    });

    res.json({ companyName });
  } catch (err) {
    console.error(
      "QBO Company API Error:",
      err.response?.data || err.message
    );

    // 🔁 If refresh token also expired
    if (err.message.includes("invalid_grant")) {
      return res.status(401).json({
        message: "QBO session expired. Please reconnect.",
      });
    }

    res.status(500).json({ message: "Failed to fetch company info" });
  }
});

module.exports = router;
