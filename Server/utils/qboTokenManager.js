const OAuthClient = require("intuit-oauth");
const File = require("../models/File");

const getValidQboAccessToken = async (fileId) => {
  const file = await File.findById(fileId);

  if (!file || !file.qbo?.isConnected) {
    throw new Error("QBO not connected");
  }

  const { accessToken, refreshToken, tokenExpiry } = file.qbo;

  // ⏱️ Check token expiry (1 min buffer)
  const isExpired =
    !tokenExpiry || new Date(tokenExpiry).getTime() - Date.now() < 60 * 1000;

  if (!isExpired) {
    return accessToken; // ✅ Token still valid
  }

  console.log("🔄 QBO Access Token Expired → Refreshing...");

  const oauthClient = new OAuthClient({
    clientId: process.env.QBO_CLIENT_ID,
    clientSecret: process.env.QBO_CLIENT_SECRET,
    environment: process.env.QBO_ENVIRONMENT,
    redirectUri: process.env.QBO_REDIRECT_URI,
  });

  // 👇 OLD refresh token set karo
  oauthClient.setToken({
    refresh_token: refreshToken,
  });

  const authResponse = await oauthClient.refresh();
  const newToken = authResponse.getJson();

  console.log("✅ QBO Token Refreshed");

  // 💾 DB Update
  await File.findByIdAndUpdate(fileId, {
    "qbo.accessToken": newToken.access_token,
    "qbo.refreshToken": newToken.refresh_token || refreshToken,
    "qbo.tokenExpiry": new Date(
      Date.now() + newToken.expires_in * 1000
    ),
  });

  return newToken.access_token;
};

module.exports = {
  getValidQboAccessToken,
};
