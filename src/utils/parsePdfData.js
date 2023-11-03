const Excel = require("exceljs");
const util = require("util");

async function parsePdfData(filePath) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filePath);
  const stockSummaryWorksheet = workbook.getWorksheet("Stock Summary");

  const stockSummaryWorksheetRows = stockSummaryWorksheet.getRows(
    11,
    // 291
    stockSummaryWorksheet.rowCount
    // stockSummaryWorksheet.rowCount
  );

  console.log("row count: " + stockSummaryWorksheetRows.length);

  let stockReportJson = {};
  let row = 0;

  // let productName = cell.value?.match(/(?<=\()([\s\w]+)(?=\))/g)?.at(-1);

  let productStockObj = {};
  let productName;
  for (let stockSummaryWorksheetRow of stockSummaryWorksheetRows) {
    row++;
    console.log(stockSummaryWorksheetRow.getCell(1).value);
    if (row == 1) {
      productName = stockSummaryWorksheetRow
        .getCell(1)
        .value?.match(/(?<=\()([\s\w]+)(?=\))/g)
        ?.at(-1);

      console.log({ productName });
      if (productName) {
        productStockObj = {
          productName,
          quantity: stockSummaryWorksheetRow.getCell(2).value,
          rate: stockSummaryWorksheetRow.getCell(3).value,
          value: stockSummaryWorksheetRow.getCell(4).value,
          fullname: stockSummaryWorksheetRow.getCell(1).value,
        };
      } else {
        row = 0;
      }
    }
    if (row == 2 && Object.keys(productStockObj).length > 0) {
      let warehouse = stockSummaryWorksheetRow.getCell(1).value.trim();
      if (stockReportJson.hasOwnProperty(warehouse)) {
        stockReportJson[warehouse].push(productStockObj);
      } else {
        stockReportJson[warehouse] = [productStockObj];
      }

      productStockObj = {};
      productName = null;
      row = 0;
    }
  }

  var fs = require("fs");
  fs.writeFile(
    "stock-report.json",
    JSON.stringify(stockReportJson),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
}

module.exports = parsePdfData;
