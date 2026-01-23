const express = require("express");
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const ALLOWED_REGIONS = ["USA", "SA", "AUS", "IR", "OTHER"];

/* CREATE FILE */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { fileName, destinationRegion } = req.body;

    if (!fileName || !destinationRegion) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!ALLOWED_REGIONS.includes(destinationRegion)) {
      return res.status(400).json({ message: "Invalid destination region" });
    }

    const file = await File.create({
      userId: req.userId,
      fileName,
      destinationRegion,
    });

    res.status(201).json(file);
  } catch (error) {
    console.error("Create file error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET USER FILES */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET SINGLE FILE BY ID */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(file);
  } catch (err) {
    console.error("GET FILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
