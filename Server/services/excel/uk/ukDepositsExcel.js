const ExcelJS = require("exceljs");
const QboRawData = require("../../../models/QboRawData");

module.exports = async function ukDepositsExcel({
  fileId,
  fromDate,
  toDate,
  res,
}) {
  try {
    const filter = {
      fileId,
      module: "deposit",
    };

    if (fromDate && toDate) {
      filter["raw.TxnDate"] = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    const records = await QboRawData.find(filter).lean();

    if (!records.length) {
      return res.status(404).json({ message: "No Deposit data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Deposits");
    sheet.columns = [
      { header: "Id", key: "invoiceId", width: 15 },
      // { header: "DocNumber", key: "docNumber", width: 15 },
      { header: "TxnDate", key: "txnDate", width: 15 },
      // { header: "CustomerId", key: "customerId", width: 15 },
      // { header: "CustomerName", key: "customerName", width: 25 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Amount", key: "amount", width: 10 },
      // { header: "TaxAmount", key: "taxamount", width: 10 },


      { header: "LineId", key: "lineId", width: 10 },
      { header: "LineNum", key: "lineNum", width: 10 },
      { header: "Description", key: "description", width: 40 },
      { header: "LineAmount", key: "lineAmount", width: 15 },
      { header: "LineDetailType", key: "lineDetailType", width: 20 },
      { header: "LineAccountId", key: "lineAccountId", width: 15 },
      { header: "LineAccountName", key: "lineAccountName", width: 25 },




      // { header: "ItemId", key: "itemId", width: 15 },
      // { header: "ItemName", key: "itemName", width: 25 },
      // { header: "Qty", key: "qty", width: 10 },
      // { header: "UnitPrice", key: "unitPrice", width: 15 },
      // { header: "TaxCode", key: "taxCode", width: 15 },
    ];

    records.forEach(({ raw }) => {
      const invoiceCommon = {
        invoiceId: Number(raw.Id),
        // docNumber: raw.DocNumber,
        txnDate: raw.TxnDate,
        // customerId: Number(raw.CustomerRef?.value),
        // customerName: raw.CustomerRef?.name,
        currency: raw.CurrencyRef?.value,
        amount: raw.TotalAmt,
        // taxamount: raw.TxnTaxDetail?.TotalTax,
      };

      raw.Line?.forEach((line) => {
        // ❌ Skip SubTotal & Tax lines
        // if (line.DetailType !== "SalesItemLineDetail") return;

        sheet.addRow({
          ...invoiceCommon,
          lineId: Number(line.Id),
          lineNum: Number(line.LineNum),
          description: line.Description,
          lineAmount: line.Amount,
          lineDetailType: line.DetailType,
          lineAccountId: Number(line.DepositLineDetail?.AccountRef?.value),
          lineAccountName: line.DepositLineDetail?.AccountRef?.name,
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
    console.error("DEPOSIT EXCEL ERROR:", err);
    res.status(500).json({ message: "Deposit Excel export failed" });
  }
};
