const ukAccountsExcel = require("./uk/ukAccountsExcel");
const ukClassExcel = require("./uk/ukClassExcel");
const ukCurreencyExcel = require("./uk/ukCurreencyExcel");
const ukCustomersExcel = require("./uk/ukCustomersExcel");
const ukItemsExcel = require("./uk/ukItemsExcel");
const ukTaxRatesExcel = require("./uk/ukTaxRatesExcel");
const ukTermsExcel = require("./uk/ukTermsExcel");
const ukVendorsExcel = require("./uk/ukVendorsExcel");
const ukInvoicesExcel = require("./uk/ukInvoicesExcel");
const ukBillsExcel = require("./uk/ukBillsExcel");
const ukJournalEntryExcel = require("./uk/ukJournalEntryExcel");
const ukPaymentsExcel = require("./uk/ukPaymentsExcel");
const ukBillPaymentsExcel = require("./uk/ukBillPaymentsExcel");

const usAccountsExcel = require("./us/usAccountsExcel");
const usClassExcel = require("./us/usClassExcel");
const usCurrencyExcel = require("./us/usCurrencyExcel");
const usCustomersExcel = require("./us/usCustomersExcel");
const usItemsExcel = require("./us/usItemsExcel");
const usTaxRatesExcel = require("./us/usTaxRatesExcel");
const usTermsExcel = require("./us/usTermsExcel");
const usVendorsExcel = require("./us/usVendorsExcel");
const usInvoicesExcel = require("./us/usInvoicesExcel");
const usBillsExcel = require("./us/usBillsExcel");
const usJournalEntryExcel = require("./us/usJournalEntryExcel");
const usPaymentsExcel = require("./us/usPaymentsExcel");
const usBillPaymentsExcel = require("./us/usBillPaymentsExcel");

const excelResolver = async ({
  fileId,
  region,
  moduleKey,
  fromDate,
  toDate,
  userId,
  res,
}) => {
  const REGION = region.toUpperCase();
  const MODULE = moduleKey.toLowerCase();

  const excelMap = {
    UK: {
      account: ukAccountsExcel,
      customer: ukCustomersExcel,
      vendor: ukVendorsExcel,
      item: ukItemsExcel,
      class: ukClassExcel,
      taxrate: ukTaxRatesExcel,
      companycurrency: ukCurreencyExcel,
      term: ukTermsExcel,
      invoice: ukInvoicesExcel,
      bill: ukBillsExcel,
      payment: ukPaymentsExcel,
      billpayment: ukBillPaymentsExcel,
      journalentry: ukJournalEntryExcel,
    },

    USA: {
      account: usAccountsExcel,
      customer: usCustomersExcel,
      vendor: usVendorsExcel,
      item: usItemsExcel,
      class: usClassExcel,
      taxrate: usTaxRatesExcel,
      companycurrency: usCurrencyExcel,
      term: usTermsExcel,
      invoice: usInvoicesExcel,
      bill: usBillsExcel,
      payment: usPaymentsExcel,
      billpayment: usBillPaymentsExcel,
      journalentry: usJournalEntryExcel,
    },

    // SA: {
    //   account: usAccountsExcel,
    //   customer: usCustomersExcel,
    //   vendor: usVendorsExcel,
    //   item: usItemsExcel,
    //   class: usClassExcel,
    //   taxrate: usTaxRatesExcel,
    //   currency: usCurrencyExcel,
    //   term: usTermsExcel,
    //   invoice: usInvoicesExcel,
    //   bill: usBillsExcel,
    //   payment: usPaymentsExcel,
    //   billpayment: usBillPaymentsExcel,
    //   journalentry: usJournalEntryExcel,
    // },

    // IR: {
    //   account: usAccountsExcel,
    //   customer: usCustomersExcel,
    //   vendor: usVendorsExcel,
    //   item: usItemsExcel,
    //   class: usClassExcel,
    //   taxrate: usTaxRatesExcel,
    //   currency: usCurrencyExcel,
    //   term: usTermsExcel,
    //   invoice: usInvoicesExcel,
    //   bill: usBillsExcel,
    //   payment: usPaymentsExcel,
    //   billpayment: usBillPaymentsExcel,
    //   journalentry: usJournalEntryExcel,
    // },

    // OTHER: {
    //   account: usAccountsExcel,
    //   customer: usCustomersExcel,
    //   vendor: usVendorsExcel,
    //   item: usItemsExcel,
    //   class: usClassExcel,
    //   taxrate: usTaxRatesExcel,
    //   currency: usCurrencyExcel,
    //   term: usTermsExcel,
    //   invoice: usInvoicesExcel,
    //   bill: usBillsExcel,
    //   payment: usPaymentsExcel,
    //   billpayment: usBillPaymentsExcel,
    //   journalentry: usJournalEntryExcel,
    // },

  };

  const regionMap = excelMap[REGION];
  if (!regionMap) {
    return res.status(400).json({ message: `Region not supported: ${REGION}` });
  }

  const excelFn = regionMap[MODULE];
  if (!excelFn) {
    return res.status(400).json({
      message: `Excel not supported for module ${MODULE} in region ${REGION}`,
    });
  }

  await excelFn({ fileId, fromDate, toDate, userId, res });
};

module.exports = excelResolver;