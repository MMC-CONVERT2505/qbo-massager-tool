const QboRawData = require("../../../models/QboRawData");
const flattenObject = require("../../../utils/flattenObject");

module.exports = async function ukClassCSV(fileId, res) {
  try {
    const records = await QboRawData.find({
      fileId,
      module: 'class',
    }).lean();

    if (!records.length) {
      return res.status(404).json({ message: "No UK class data found" });
    }

    // 🔑 Flatten first record to generate headers
    const headers = Object.keys(flattenObject(records[0].raw));

    // 🧱 CSV Header Row
    let csv = headers.join(",") + "\n";

    // 🔁 CSV Data Rows
    records.forEach((record) => {
      const flat = flattenObject(record.raw);

      const row = headers.map((key) => {
        let value = flat[key];

        // Handle commas, quotes, newlines safely
        if (value === null || value === undefined) value = "";
        value = String(value).replace(/"/g, '""');

        return `"${value}"`;
      });

      csv += row.join(",") + "\n";
    });

    // 📦 Response headers
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=united_kingdom.csv"
    );
    res.setHeader("Content-Type", "text/csv");

    return res.status(200).send(csv);
  } catch (err) {
    console.error("UK CSV ERROR:", err);
    res.status(500).json({ message: "UK CSV export failed" });
  }
};
