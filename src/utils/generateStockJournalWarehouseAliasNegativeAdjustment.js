const fs = require("fs");
const ExcelJS = require("exceljs");
const path = require("path");
const parseDate = require("./strftime");
const getStockJournalEntryJson = require("./getStockJournalEntryJson");

const reorderArrayToStartFromGivenIndex = function (array, index) {
  let start = array.slice(index); // This will return me elements from a given index
  let end = array.slice(0, index); // This will return me elements before a given index
  return start.concat(end); // Concat 2nd array to first and return the result.
};

async function generateStockJournalWarehouseAliasNegativeAdjustment(
  stockJournalDateObj
) {
  const stockReportJsonPath = `${__dirname}/generated_files/stock-report.json`;

  if (!fs.existsSync(stockReportJsonPath)) {
    return { status: "failed", message: "Stock summary data not uploaded" };
  }

  const stockSummaryJson = JSON.parse(fs.readFileSync(stockReportJsonPath));

  /* Create Obj of all products with negative stock values */
  const stockJournalArray = [];
  const warehouseArray = Object.keys(stockSummaryJson);

  // Implement warehouse adjustment, some working code:
  function getPositiveProductFromDifferentWarehouseAlias(
    fullProductName,
    minimumPositiveQuanity,
    reorderedWarehouseArray
  ) {
    let warehouse;
    for (warehouse of reorderedWarehouseArray) {
      const childProductObj = stockSummaryJson[warehouse].find(
        ({ fullName, quantity }) =>
          fullName == fullProductName && quantity >= minimumPositiveQuanity
      );
      if (childProductObj) {
        return {
          ...childProductObj,
          warehouse,
          minimumPositiveQuanity,
        };
      }
    }

    return null;
  }

  // // Negative products between warehouse alias adjustment logic
  // const newWarehouseArray = warehouseArray.slice(0);
  // newWarehouseArray.pop(warehouse);

  // const positiveProductFromDifferentWarehouseAliasObj =
  //   getPositiveProductFromDifferentWarehouseAlias(
  //     fullName,
  //     Math.abs(quantity),
  //     newWarehouseArray
  //   );
  // console.log(positiveProductFromDifferentWarehouseAliasObj);

  // Stock adjustment logic

  for (let warehouse of warehouseArray) {
    for (let productObj of stockSummaryJson[warehouse]) {
      const { productName, quantity, rate, fullName } = productObj;
      if (quantity < 0) {
        const newWarehouseArray = warehouseArray.slice(0);
        newWarehouseArray.pop(warehouse);

        const positiveProductFromDifferentWarehouseAliasObj =
          getPositiveProductFromDifferentWarehouseAlias(
            fullName,
            Math.abs(quantity),
            newWarehouseArray
          );
        console.log(positiveProductFromDifferentWarehouseAliasObj);

        if (positiveProductFromDifferentWarehouseAliasObj) {
          const {
            fullName: positiveQuantityProductName,
            minimumPositiveQuanity: positiveQuantityQuantity,
            rate: positiveQuantityRate,
            warehouse: positiveQuantityWarehouse,
          } = positiveProductFromDifferentWarehouseAliasObj;

          // const stockJournalInObjet = {
          //   Date: parseDate("%d/%b/%Y", stockJournalDateObj),
          //   VoucherType: parseDate("STN/%d%m%y/01"),
          //   "Item Name": fullName,
          //   Unit: "Pcs",
          //   Godown: warehouse,
          //   Type: "in",
          //   Qty: Math.abs(quantity),
          //   Rate: positiveQuantityRate,
          // };

          const stockJournalInObject = getStockJournalEntryJson(
            parseDate("%d/%b/%Y", stockJournalDateObj), // Date
            parseDate("STN/%d%m%y/01"), // vocher number
            fullName, // item name
            warehouse, // godown
            "in", // type (in or out)
            Math.abs(quantity), // quantity (qty)
            positiveQuantityRate, // rate
            positiveQuantityRate * Math.abs(quantity) // amount (rate * qty)
          );

          stockJournalArray.push(stockJournalInObject);

          // const stockJournalOutObjet = {
          //   Date: parseDate("%d/%b/%Y", stockJournalDateObj),
          //   VoucherType: parseDate("STN/%d%m%y/01"),
          //   "Item Name": positiveQuantityProductName.replaceAll(
          //     /\(\w{10}\)/gm,
          //     ""
          //   ),
          //   Unit: "Pcs",
          //   Godown: positiveQuantityWarehouse,
          //   Type: "out",
          //   Qty: positiveQuantityQuantity,
          //   Rate: positiveQuantityRate,
          // };

          const stockJournalOutObject = getStockJournalEntryJson(
            parseDate("%d/%b/%Y", stockJournalDateObj),
            parseDate("STN/%d%m%y/01"),
            positiveQuantityProductName,
            positiveQuantityWarehouse,
            "out",
            positiveQuantityQuantity,
            positiveQuantityRate,
            positiveQuantityRate * Math.abs(positiveQuantityQuantity)
          );

          stockJournalArray.push(stockJournalOutObject);
        }
      }
    }
  }

  if (stockJournalArray.length == 0) {
    return {
      status: "failed",
      message: "No negative stock adjustments found",
    };
  }

  console.log("Warehouses ", warehouseArray);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mustafa";
  workbook.lastModifiedBy = "Mustafa";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  const worksheet = workbook.addWorksheet("My Sheet");
  worksheet.columns = [
    ...Object.keys(stockJournalArray[0]).map(key => {
      return { header: key, key: key, width: 10 };
    }),
  ];

  for (let stockJournalObj of stockJournalArray) {
    worksheet.addRow(stockJournalObj);
  }

  const stockJournalFileName = parseDate("stockJournal-%y%m%d%M%S.xlsx");
  await workbook.xlsx.writeFile(stockJournalFileName);

  return {
    status: "success",
    message: `${stockJournalFileName} created`,
  };
}

module.exports = generateStockJournalWarehouseAliasNegativeAdjustment;
