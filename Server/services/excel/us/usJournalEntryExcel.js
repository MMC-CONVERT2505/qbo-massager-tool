const ExcelJS = require("exceljs");
const QboRawData = require("../../../models/QboRawData");

module.exports = async function usJournalEntryExcel({
  fileId,
  fromDate,
  toDate,
  res,
}) {
  try {
    const filter = {
      fileId,
      module: "journalentry",
    };

    if (fromDate && toDate) {
      filter["raw.TxnDate"] = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    const records = await QboRawData.find(filter).lean();


    if (!records.length) {
      return res.status(404).json({ message: "No Journal data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Journal");

    sheet.columns = [
      { header: "Id", key: "journalId", width: 15 },
      { header: "DocNumber", key: "docNumber", width: 15 },
      { header: "TxnDate", key: "txnDate", width: 15 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "TaxAmount", key: "taxamount", width: 10 },


      { header: "LineId", key: "lineId", width: 10 },
      { header: "AccountId", key: "accountId", width: 15 },
      { header: "AccountName", key: "accountName", width: 25 },
      { header: "UnitPrice", key: "unitPrice", width: 15 },
      { header: "LineAmount", key: "lineAmount", width: 15 },
    ];

    records.forEach(({ raw }) => {
      const journalCommon = {
        journalId: raw.Id,
        docNumber: raw.DocNumber,
        txnDate: raw.TxnDate,
        currency: raw.CurrencyRef?.value,
        taxamount: raw.TxnTaxDetail?.TotalTax,
      };

      raw.Line?.forEach((line) => {
        // ❌ Skip SubTotal & Tax lines
        // if (line.DetailType !== "JournalEntryLineDetail") return;

        sheet.addRow({
          ...journalCommon,
          lineId: line.Id,
          accountId: line.JournalEntryLineDetail?.AccountRef?.value,
          accountName: line.JournalEntryLineDetail?.AccountRef?.name,
          unitPrice: line.JournalEntryLineDetail?.PostingType,
          lineAmount: line.Amount,
        });
      });
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=united_states.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Journal EXCEL ERROR:", err);
    res.status(500).json({ message: "Journal Excel export failed" });
  }
};
