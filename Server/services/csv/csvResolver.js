const ukAccountsCSV = require("./uk/ukAccountsCSV");
const ukClassCSV = require("./uk/ukClassCSV");
const ukCurrencyCSV = require("./uk/ukCurrencyCSV");
const ukCustomersCSV = require("./uk/ukCustomersCSV");
const ukItemsCSV = require("./uk/ukItemsCSV");
const ukTaxRatesCSV = require("./uk/ukTaxRatesCSV");
const ukTermsCSV = require("./uk/ukTermsCSV");
const ukVendorsCSV = require("./uk/ukVendorsCSV");


const usAccountsCSV = require("./us/usAccountsCSV");
const usClassCSV = require("./us/usClassCSV");
const usCurrencyCSV = require("./us/usCurrencyCSV");
const usCustomersCSV = require("./us/usCustomersCSV");
const usTaxRatesCSV = require("./us/usTaxRatesCSV");
const usTermsCSV = require("./us/usTermsCSV");
const usVendorsCSV = require("./us/usVendorsCSV");
const usItemsCSV = require("./us/usItemsCSV");

const csvResolver = async ({ fileId, region, moduleKey, res }) => {
  const REGION = region.toUpperCase();
  const MODULE = moduleKey.toLowerCase();

  const excelMap = {
    UK: {
      account: ukAccountsCSV,
      customer: ukCustomersCSV,
      vendor: ukVendorsCSV,
      item: ukItemsCSV,
      class: ukClassCSV,
      taxrate: ukTaxRatesCSV,
      currency: ukCurrencyCSV,
      term: ukTermsCSV,
    },

    USA: {
      account: usAccountsCSV,
      customer: usCustomersCSV,
      vendor: usVendorsCSV,
      item: usItemsCSV,
      class: usClassCSV,
      taxrate: usTaxRatesCSV,
      currency: usCurrencyCSV,
      term: usTermsCSV,
    },

    SA: {
      account: usAccountsExcel,
      customer: usCustomersExcel,
      vendor: usVendorsExcel,
      item: usItemsExcel,
      class: usClassExcel,
      taxrate: usTaxRatesExcel,
      currency: usCurrencyExcel,
      term: usTermsExcel,
      invoice: usInvoicesExcel,
      bill: usBillsExcel,
      payment: usPaymentsExcel,
      billpayment: usBillPaymentsExcel,
      journalentry: usJournalEntryExcel,
    },

    IR: {
      account: usAccountsExcel,
      customer: usCustomersExcel,
      vendor: usVendorsExcel,
      item: usItemsExcel,
      class: usClassExcel,
      taxrate: usTaxRatesExcel,
      currency: usCurrencyExcel,
      term: usTermsExcel,
      invoice: usInvoicesExcel,
      bill: usBillsExcel,
      payment: usPaymentsExcel,
      billpayment: usBillPaymentsExcel,
      journalentry: usJournalEntryExcel,
    },

    OTHER: {
      account: usAccountsExcel,
      customer: usCustomersExcel,
      vendor: usVendorsExcel,
      item: usItemsExcel,
      class: usClassExcel,
      taxrate: usTaxRatesExcel,
      currency: usCurrencyExcel,
      term: usTermsExcel,
      invoice: usInvoicesExcel,
      bill: usBillsExcel,
      payment: usPaymentsExcel,
      billpayment: usBillPaymentsExcel,
      journalentry: usJournalEntryExcel,
    },

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

  // 🚀 finally call correct function
  await excelFn(fileId, res);
};

module.exports = csvResolver;