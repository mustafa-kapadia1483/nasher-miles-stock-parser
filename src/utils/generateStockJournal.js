const fs = require("fs");
const ExcelJS = require("exceljs");
const path = require("path");
const parseDate = require("./strftime");

const reorderArrayToStartFromGivenIndex = function (array, index) {
  let start = array.slice(index); // This will return me elements from a given index
  let end = array.slice(0, index); // This will return me elements before a given index
  return start.concat(end); // Concat 2nd array to first and return the result.
};

async function generateStockJournal() {
  const lightsAsinParentChildMappingJsonPath =
    "../../lights-asin-parent-child-mapping.json";
  const stockReportJsonPath = "../../stock-report.json";

  if (
    !fs.existsSync(
      path.resolve(__dirname, lightsAsinParentChildMappingJsonPath)
    )
  ) {
    return "Lights asin parent child mapping data not uploaded";
  }
  if (!fs.existsSync(path.resolve(__dirname, stockReportJsonPath))) {
    return "Stock summary data not uploaded";
  }

  const lightsAsinParentChildMappingJson = require(lightsAsinParentChildMappingJsonPath);
  const stockSummaryJson = require(stockReportJsonPath);

  /* Create Obj of all products with negative stock values */
  const stockJournalArray = [];
  const warehouseArray = Object.keys(stockSummaryJson);

  function getChildProductObj(
    childAsin,
    minimumChildQuanity,
    reorderedWarehouseArray
  ) {
    let warehouse;
    for (warehouse of reorderedWarehouseArray) {
      const childProductObj = stockSummaryJson[warehouse].find(
        ({ productName, quantity }) =>
          productName == childAsin && quantity >= minimumChildQuanity
      );
      if (childProductObj) {
        return {
          ...childProductObj,
          warehouse,
          minimumChildQuanity,
        };
      }
    }

    return null;
  }

  for (let warehouse of warehouseArray) {
    for (let productObj of stockSummaryJson[warehouse]) {
      const { productName, quantity, rate } = productObj;
      if (quantity < 0) {
        const lightMappingJson = lightsAsinParentChildMappingJson[productName];
        if (lightMappingJson) {
          const childAsin = lightMappingJson["child asin"];

          /* reorder array to first check in same warehouse */
          const reorderedWarehouseArray = reorderArrayToStartFromGivenIndex(
            warehouseArray,
            warehouseArray.findIndex(wh => wh == warehouse)
          );
          const childProductObj = getChildProductObj(
            childAsin,
            Math.abs(quantity) * lightMappingJson["parent sku"].match(/\d$/)[0],
            reorderedWarehouseArray
          );

          if (childProductObj) {
            const {
              productName: childProductName,
              minimumChildQuanity: childQuantity,
              rate: childRate,
              warehouse: childWarehouse,
            } = childProductObj;

            // console.log(childProductObj);

            const stockJournalInObjet = {
              Date: parseDate("%d/%b/%Y"),
              VoucherType: parseDate("STN/%d%m%y/01"),
              "Item Name": productName,
              Unit: "Pcs",
              Godown: warehouse,
              Type: "in",
              Qty: Math.abs(quantity),
              Rate: rate,
            };

            stockJournalArray.push(stockJournalInObjet);

            const stockJournalOutObjet = {
              Date: parseDate("%d/%b/%Y"),
              VoucherType: parseDate("STN/%d%m%y/01"),
              "Item Name": childProductName,
              Unit: "Pcs",
              Godown: childWarehouse,
              Type: "out",
              Qty: childQuantity,
              Rate: (rate * Math.abs(quantity)) / childQuantity,
            };

            stockJournalArray.push(stockJournalOutObjet);
          }
        }
      }
    }
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

  await workbook.csv.writeFile("stockJournal.xls");
}

module.exports = generateStockJournal;
