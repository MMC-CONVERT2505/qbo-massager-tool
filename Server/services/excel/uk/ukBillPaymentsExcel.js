const ExcelJS = require("exceljs");
const QboRawData = require("../../../models/QboRawData");

module.exports = async function ukBillPaymentsExcel(fileId, res) {
  try {
    const records = await QboRawData.find({
      fileId,
      module: "billpayment",
    }).lean();

    if (!records.length) {
      return res.status(404).json({ message: "No Bill Payment data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("BillPayment");

    sheet.columns = [
      { header: "Id", key: "invoiceId", width: 15 },
      { header: "TxnDate", key: "txnDate", width: 15 },
      { header: "VendorId", key: "customerId", width: 15 },
      { header: "VendorName", key: "customerName", width: 25 },
      { header: "PayType", key: "paytype", width: 25 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Amount", key: "amount", width: 10 },


      { header: "TxnId", key: "txnId", width: 15 },
      { header: "TxnType", key: "txnType", width: 25 },
      { header: "LineAmount", key: "lineAmount", width: 15 },
    ];

    records.forEach(({ raw }) => {
      const paymentCommon = {
        invoiceId: raw.Id,
        txnDate: raw.TxnDate,
        customerId: raw.VendorRef?.value,
        customerName: raw.VendorRef?.name,
        paytype: raw.PayType,
        currency: raw.CurrencyRef?.value,
        amount: raw.TotalAmt,
      };

      raw.Line?.forEach((line) => {
        // Agar LinkedTxn hi nahi hai to skip
        if (!line.LinkedTxn || !line.LinkedTxn.length) {
          sheet.addRow({
            ...paymentCommon,
            lineAmount: line.Amount,
            txnId: null,
            txnType: null,
          });
          return;
        }

        // 🔁 EACH LinkedTxn = ONE ROW
        line.LinkedTxn.forEach((txn) => {
          sheet.addRow({
            ...paymentCommon,
            lineAmount: line.Amount,
            txnId: txn.TxnId,
            txnType: txn.TxnType,
          });
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
    console.error("BILL PAYMENT EXCEL ERROR:", err);
    res.status(500).json({ message: "Bill Payment Excel export failed" });
  }
};
