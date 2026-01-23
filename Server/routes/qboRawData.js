// routes/qboRawData.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const QboRawData = require("../models/QboRawData");
const authMiddleware = require("../middleware/authMiddleware");
const excelResolver = require("../services/excel/excelResolver");
const csvResolver = require("../services/csv/csvResolver");


router.get("/sync-dates/:fileId", authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid fileId" });
    }

    const data = await QboRawData.aggregate([
      {
        $match: {
          fileId: new mongoose.Types.ObjectId(fileId),
        },
      },
      {
        $group: {
          _id: "$module",
          syncDate: { $max: "$syncedAt" },
        },
      },
    ]);

    const result = {};
    data.forEach((d) => {
      result[d._id] = d.syncDate;
    });

    res.json(result);
  } catch (error) {
    console.error("❌ Sync date fetch error:", error);
    res.status(500).json({ message: "Failed to fetch sync dates" });
  }
});

// DELETE QBO RAW DATA BY REALM ID + MODULE
router.delete("/delete/:realmId/:module", authMiddleware, async (req, res) => {
  try {
    const { realmId, module } = req.params;

    if (!realmId || !module) {
      return res.status(400).json({ message: "realmId and module required" });
    }

    const result = await QboRawData.deleteMany({
      realmId: realmId,
      module: module,
    });

    res.json({
      message: "Module data deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Delete QBO module error:", error);
    res.status(500).json({ message: "Failed to delete module data" });
  }
}
);

// GET /api/qborawdata/summary/:realmId
router.get("/summary/:realmId", authMiddleware, async (req, res) => {
  try {
    const { realmId } = req.params;

    const data = await QboRawData.aggregate([
      {
        $match: { realmId }
      },
      {
        $group: {
          _id: "$module",
          count: { $sum: 1 },              // ✅ each doc = 1 record
          lastSync: { $max: "$syncedAt" }
        }
      }
    ]);

    const result = {};
    data.forEach(d => {
      result[d._id] = {
        count: d.count,
        lastSync: d.lastSync
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
});

// Excel export route
router.get(
  "/export-excel/:fileId/:region/:moduleKey",
  authMiddleware,
  async (req, res) => {
    const { fileId, region, moduleKey } = req.params;
    const { fromDate, toDate } = req.query; // 👈 NEW

    try {
      await excelResolver({
        fileId,
        region,
        moduleKey,
        fromDate,
        toDate,
        userId: req.userId,
        res,
      });
    } catch (err) {
      console.error("EXCEL EXPORT ERROR:", err);
      res.status(500).json({ message: "Excel export failed" });
    }
  }
);


//CSV export route
router.get(
  "/export-csv/:fileId/:region/:moduleKey",
  authMiddleware,
  async (req, res) => {
    const { fileId, region, moduleKey } = req.params;
    const { fromDate, toDate } = req.query; // 👈 NEW

    try {
      await csvResolver({
        fileId,
        region,
        moduleKey,
        fromDate,
        toDate,
        userId: req.userId,
        res,
      });
    } catch (err) {
      console.error("CSV EXPORT ERROR:", err);
      res.status(500).json({ message: "CSV export failed" });
    }
  }
);

module.exports = router;
