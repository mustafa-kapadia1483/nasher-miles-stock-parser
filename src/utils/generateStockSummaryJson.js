const Excel = require("exceljs");
const util = require("util");

async function generateStockSummaryJson(filePath, warehouseAliasList) {
  try {
    if (warehouseAliasList.length == 0) {
      return { status: "failed", message: "Select a warehouse location" };
    }
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(filePath);
    const stockSummaryWorksheet = workbook.worksheets[0];

    const stockSummaryWorksheetRows = stockSummaryWorksheet.getRows(
      0,
      // 291
      stockSummaryWorksheet.rowCount
      // stockSummaryWorksheet.rowCount
    );

    console.log("row count: " + stockSummaryWorksheetRows.length);

    let stockReportJson = {};
    let row = 0;

    // let productName = cell.value?.match(/(?<=\()([\s\w]+)(?=\))/g)?.at(-1);

    let productStockObj = {};
    let productName, fullName;

    for (let stockSummaryWorksheetRow of stockSummaryWorksheetRows) {
      if (stockSummaryWorksheetRow.getCell(1).value == null) {
        continue;
      }
      if (stockSummaryWorksheetRow.getCell(1).value.match(/grand total/gi)) {
        break;
      }
      // console.log(stockSummaryWorksheetRow.getCell(1).value);
      console.log({ productName });

      let warehouse = stockSummaryWorksheetRow.getCell(1).value.trim();
      console.log({ warehouse, warehouseAliasList });

      if (warehouseAliasList.includes(warehouse)) {
        let productStockObj = {
          productName: itemName,
          quantity: stockSummaryWorksheetRow.getCell(2).value,
          rate: stockSummaryWorksheetRow.getCell(3).value,
          value: stockSummaryWorksheetRow.getCell(4).value,
          fullName,
        };

        if (stockReportJson.hasOwnProperty(warehouse)) {
          stockReportJson[warehouse].push(productStockObj);
        } else {
          stockReportJson[warehouse] = [productStockObj];
        }
      } else {
        itemName = stockSummaryWorksheetRow
          .getCell(1)
          .value?.match(/(?<=\()([\s\w]+)(?=\))/g)
          ?.at(-1);

        fullName = stockSummaryWorksheetRow.getCell(1).value;

        // console.log({ productName });
        // if (productName) {
        //   productStockObj = {
        //     productName,
        //     quantity: stockSummaryWorksheetRow.getCell(2).value,
        //     rate: stockSummaryWorksheetRow.getCell(3).value,
        //     value: stockSummaryWorksheetRow.getCell(4).value,
        //     fullname: stockSummaryWorksheetRow.getCell(1).value,
        //   };
        // } else {
        //   row = 0;
        // }
      }

      // if (row == 2 && Object.keys(productStockObj).length > 0) {
      //   let warehouse = stockSummaryWorksheetRow.getCell(1).value.trim();
      //   if (stockReportJson.hasOwnProperty(warehouse)) {
      //     stockReportJson[warehouse].push(productStockObj);
      //   } else {
      //     stockReportJson[warehouse] = [productStockObj];
      //   }

      //   productStockObj = {};
      //   productName = null;
      //   row = 0;
      // }
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

    return { status: "success", message: "Stock report JSON created" };
  } catch (error) {
    return {
      status: "failed",
      message: `Error Occurred while parsing stock data ${error}`,
    };
  }
}

module.exports = generateStockSummaryJson;
