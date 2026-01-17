const QboRawData = require("../../../models/QboRawData");
const flattenObject = require("../../../utils/flattenObject");

module.exports = async function ukAccountsCSV(fileId, res) {
  try {
    const records = await QboRawData.find({
      fileId,
      module: "account",
    }).lean();

    if (!records.length) {
      return res.status(404).json({ message: "No UK data found" });
    }

    const headers = Object.keys(flattenObject(records[0].raw));

    let csv = headers.join(",") + "\n";

    records.forEach((record) => {
      const flat = flattenObject(record.raw);

      const row = headers.map((key) => {
        let value = flat[key];

        if (value === null || value === undefined) value = "";
        value = String(value).replace(/"/g, '""');

        return `"${value}"`;
      });

      csv += row.join(",") + "\n";
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=united_kingdom_accounts.csv"
    );
    res.setHeader("Content-Type", "text/csv");

    return res.status(200).send(csv);
  } catch (err) {
    console.error("UK CSV ERROR:", err);
    return res.status(500).json({ message: "UK CSV export failed" });
  }
};
