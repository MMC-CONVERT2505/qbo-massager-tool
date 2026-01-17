const express = require("express");
const axios = require("axios");
const File = require("../models/File");
const QboRawData = require("../models/QboRawData");
const authMiddleware = require("../middleware/authMiddleware");
const { getValidQboAccessToken } = require("../utils/qboTokenManager");
const qboEndpoints = require("../utils/qboEndpoints");

const router = express.Router();

const fetchAllQboRestData = async ({
  baseUrl,
  realmId,
  endpoint,
  responseKey,
  accessToken,
}) => {
  let allData = [];
  let startPosition = 1;
  const maxResults = 1000;

  while (true) {
    const response = await axios.get(
      `${baseUrl}/v3/company/${realmId}/${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        params: {
          minorversion: 75,
          startposition: startPosition,
          maxresults: maxResults,
        },
      }
    );

    const chunk = response.data?.[responseKey] || [];

    allData.push(...chunk);

    if (chunk.length < maxResults) break;

    startPosition += maxResults;
  }

  return allData;
};

const fetchAndStoreQboQueryData = async ({
  baseUrl,
  realmId,
  table,
  responseKey,
  accessToken,
  onChunk,
  onProgress,   // 👈 NEW
}) => {
  let startPosition = 1;
  const maxResults = 1000;
  let total = 0;

  while (true) {
    const query = `
      select * from ${table}
      startposition ${startPosition}
      maxresults ${maxResults}
    `;

    const response = await axios.get(
      `${baseUrl}/v3/company/${realmId}/query?minorversion=75`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        params: { query },
      }
    );

    const chunk =
      response.data?.QueryResponse?.[responseKey] || [];

    if (!chunk.length) break;

    await onChunk(chunk);

    total += chunk.length;

    // 🔥 LIVE PROGRESS LOG
    if (onProgress) {
      onProgress({
        fetched: chunk.length,
        total,
        startPosition,
      });
    }

    if (chunk.length < maxResults) break;

    startPosition += maxResults;

    await new Promise(r => setTimeout(r, 250));
  }

  return total;
};




/* SYNC QBO DATA USING REST API */
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const { fileId, modules } = req.body;

    console.log("\n📥 Sync Request:", { fileId, modules });

    const file = await File.findOne({ _id: fileId, userId: req.userId });

    if (!file?.qbo?.isConnected) {
      return res.status(400).json({ message: "QBO not connected" });
    }

    const accessToken = await getValidQboAccessToken(fileId);

    const baseUrl =
      process.env.QBO_ENVIRONMENT === "sandbox"
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";

    const result = {};

    for (const module of modules) {
      const config = qboEndpoints[module];
      if (!config) continue;

      console.log(`🔄 Syncing Module: ${module}`);

      try {
        let data = [];

        /* ================= REST ================= */
        if (config.type === "REST") {
          data = await fetchAllQboRestData({
            baseUrl,
            realmId: file.qbo.realmId,
            endpoint: config.endpoint,
            responseKey: config.responseKey,
            accessToken,
          });
        }

        /* ================= QUERY ================= */
        if (config.type === "QUERY") {

          await QboRawData.deleteMany({
            userId: req.userId,
            fileId,
            realmId: file.qbo.realmId,
            module,
          });

          const total = await fetchAndStoreQboQueryData({
            baseUrl,
            realmId: file.qbo.realmId,
            table: config.table,
            responseKey: config.responseKey,
            accessToken,
            onChunk: async (chunk) => {
              const uniqueChunk = Object.values(
                chunk.reduce((acc, item) => {
                  acc[item.Id] = item;
                  return acc;
                }, {})
              );

              const ops = uniqueChunk.map(item => ({
                updateOne: {
                  filter: {
                    userId: req.userId,
                    fileId,
                    realmId: file.qbo.realmId,
                    module,
                    qboId: item.Id,
                  },
                  update: {
                    $set: {
                      raw: item,
                      syncedAt: new Date(),
                    },
                  },
                  upsert: true,
                },
              }));

              await QboRawData.bulkWrite(ops, { ordered: false });
            },

            // 🔥 HERE IS THE CONSOLE LOG
            onProgress: ({ fetched, total }) => {
              console.log(
                `🔄 ${module}: fetched ${fetched} | total so far ${total}`
              );
            },
          });


          result[module] = total;
        }


      } catch (moduleErr) {
        const qboError =
          moduleErr.response?.data?.Fault?.Error?.[0] || moduleErr.message;

        console.error(`❌ ${module} FAILED`);
        console.error("QBO Error:", qboError);

        result[module] = {
          error: qboError,
        };
      }
    }

    res.json({
      message: "QBO sync completed",
      summary: result,
    });
  } catch (err) {
    console.error("🔥 GLOBAL SYNC ERROR:", err);
    res.status(500).json({ message: "QBO sync failed" });
  }
});


module.exports = router;
