const ExcelJS = require("exceljs");
const QboRawData = require("../../../models/QboRawData");
const flattenObject = require("../../../utils/flattenObject");

// module.exports = async function ukCurrencyExcel(fileId, res) {
//   try {
//     const records = await QboRawData.find({
//       fileId,
//       module: 'companycurrency',
//     }).lean();

module.exports = async function ukCurrencyExcel({
  fileId,
  res,
}) {
  try {
    const filter = {
      fileId,
      module: "companycurrency",
    };

    const records = await QboRawData.find(filter).lean();


    if (!records.length) {
      return res.status(404).json({ message: "No UK company currency data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("United Kingdom");

    // 🔑 Generate columns from FIRST RAW record
    const sampleRow = flattenObject(records[0].raw);

    sheet.columns = Object.keys(sampleRow).map((key) => ({
      header: key,
      key,
      width: 25,
    }));

    // 🔁 Add rows (ONE record = ONE row)
    records.forEach((record) => {
      sheet.addRow(flattenObject(record.raw));
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=united_kingdom.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("UK EXCEL ERROR:", err);
    res.status(500).json({ message: "UK Excel export failed" });
  }
};
