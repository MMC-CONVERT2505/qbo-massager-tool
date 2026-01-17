const ExcelJS = require("exceljs");
const QboRawData = require("../../../models/QboRawData");

module.exports = async function ukBillsExcel(fileId, res) {
  try {
    const records = await QboRawData.find({
      fileId,
      module: "bill",
    }).lean();

    if (!records.length) {
      return res.status(404).json({ message: "No Bill data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("bills");

    sheet.columns = [
      { header: "Id", key: "billId", width: 15 },
      { header: "DocNumber", key: "docNumber", width: 15 },
      { header: "TxnDate", key: "txnDate", width: 15 },
      { header: "CustomerId", key: "customerId", width: 15 },
      { header: "CustomerName", key: "customerName", width: 25 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Amount", key: "amount", width: 10 },
      { header: "TaxAmount", key: "taxamount", width: 10 },


      { header: "LineId", key: "lineId", width: 10 },
      { header: "LineNum", key: "lineNum", width: 10 },
      { header: "AccountId", key: "accountId", width: 15 },
      { header: "AccountName", key: "accountName", width: 25 },
      { header: "LineAmount", key: "lineAmount", width: 15 },
      { header: "TaxCode", key: "taxCode", width: 15 },
    ];

    records.forEach(({ raw }) => {
      const billCommon = {
        billId: raw.Id,
        docNumber: raw.DocNumber,
        txnDate: raw.TxnDate,
        customerId: raw.VendorRef?.value,
        customerName: raw.VendorRef?.name,
        currency: raw.CurrencyRef?.value,
        amount: raw.TotalAmt,
        taxamount: raw.TxnTaxDetail?.TotalTax,
      };

      raw.Line?.forEach((line) => {
        // ❌ Skip SubTotal & Tax lines
        // if (line.DetailType !== "AccountBasedExpenseLineDetail") return;

        sheet.addRow({
          ...billCommon,
          lineId: line.Id,
          lineNum: line.LineNum,
          accountId: line.AccountBasedExpenseLineDetail?.AccountRef?.value,
          accountName: line.AccountBasedExpenseLineDetail?.AccountRef?.name,
          lineAmount: line.Amount,
          taxCode: line.AccountBasedExpenseLineDetail?.TaxCodeRef?.value,
        });
      });
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
    console.error("BILLS EXCEL ERROR:", err);
    res.status(500).json({ message: "Bills Excel export failed" });
  }
};
