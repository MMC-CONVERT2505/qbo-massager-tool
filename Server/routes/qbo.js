const express = require("express");
const OAuthClient = require("intuit-oauth");
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ QBO ROUTES LOADED");

const oauthClient = new OAuthClient({
  clientId: process.env.QBO_CLIENT_ID,
  clientSecret: process.env.QBO_CLIENT_SECRET,
  environment: process.env.QBO_ENVIRONMENT,
  redirectUri: process.env.QBO_REDIRECT_URI,
});

/* STEP 1: GENERATE AUTH URL */
router.get("/connect/:fileId", authMiddleware, async (req, res) => {
  console.log("➡️ /connect API HIT");
  console.log("🔐 User ID:", req.userId);
  console.log("📁 File ID:", req.params.fileId);

  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      userId: req.userId,
    });

    if (!file) {
      console.log("❌ File NOT found");
      return res.status(404).json({ message: "File not found" });
    }

    console.log("✅ File found:", file.fileName);

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: fileId,
    });

    console.log("🔗 Auth URL generated successfully");
    console.log("➡️ Auth URL:", authUri);

    res.json({ url: authUri });
  } catch (err) {
    console.error("🔥 ERROR in /connect:", err);
    res.status(500).json({ message: "QBO connect failed" });
  }
});

/* STEP 2: CALLBACK */
router.get("/callback", async (req, res) => {
  console.log("⬅️ QBO CALLBACK HIT");
  console.log("📥 Query Params:", req.query);

  try {
    console.log("🔄 Creating token from callback URL...");

    const authResponse = await oauthClient.createToken(req.url);
    const tokenData = authResponse.getJson();

    console.log("✅ Token created successfully");
    console.log("🔑 Token Data:", {
      access_token: tokenData.access_token ? "RECEIVED" : "MISSING",
      refresh_token: tokenData.refresh_token ? "RECEIVED" : "MISSING",
      expires_in: tokenData.expires_in,
    });

    const realmId = oauthClient.getToken().realmId;
    const fileId = oauthClient.getToken().state;

    console.log("🏢 Realm ID:", realmId);
    console.log("📁 File ID from state:", fileId);

    await File.findByIdAndUpdate(fileId, {
      qbo: {
        isConnected: true,
        realmId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        connectedAt: new Date(),
      },
    });

    console.log("✅ File updated with QBO connection");

    res.send(`
      <script>
        console.log("QBO connected, closing window");
        window.close();
      </script>
    `);
  } catch (err) {
    console.error("🔥 QBO CALLBACK ERROR");
    console.error("Message:", err.message);
    console.error("Full Error:", err);

    res.status(500).send("QBO connection failed");
  }
});

router.post("/disconnect/:fileId", authMiddleware, async (req, res) => {
  await File.findOneAndUpdate(
    { _id: req.params.fileId, userId: req.userId },
    {
      qbo: {
        isConnected: false,
        realmId: null,
        accessToken: null,
        refreshToken: null,
        companyName: null,
      },
    }
  );

  res.json({ message: "QBO disconnected successfully" });
});

module.exports = router;
