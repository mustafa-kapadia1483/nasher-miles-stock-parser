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

async function generateStockJournalLightPacks() {
  const lightsAsinParentChildMappingJsonPath =
    "./lights-asin-parent-child-mapping.json";
  const stockReportJsonPath = "./stock-report.json";

  if (
    !fs.existsSync(
      path.resolve(__dirname, lightsAsinParentChildMappingJsonPath)
    )
  ) {
    return {
      status: "failed",
      message: "Lights asin parent child mapping data not uploaded",
    };
  }
  if (!fs.existsSync(path.resolve(__dirname, stockReportJsonPath))) {
    return { status: "failed", message: "Stock summary data not uploaded" };
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

  // Stock adjustment logic

  for (let warehouse of warehouseArray) {
    for (let productObj of stockSummaryJson[warehouse]) {
      const { productName, quantity, rate, fullName } = productObj;
      if (quantity < 0) {
        // Lights pack adjustment logic
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
            Math.abs(quantity) *
              parseInt(lightMappingJson["parent sku"].match(/\d+$/)?.[0]),
            reorderedWarehouseArray
          );

          if (childProductObj) {
            const {
              fullName: childProductName,
              minimumChildQuanity: childQuantity,
              rate: childRate,
              warehouse: childWarehouse,
            } = childProductObj;

            // console.log(childProductObj);

            // If parent SKU is having negative stock & rate is provided then we multiply the rate of parent product x absolute of negative quantity then divide it by quantity of child product
            let inStockRate = rate;

            // If parent SKU is having negative stock & rate is not provided then in this case we take the rate of the positive product (child)
            if (inStockRate == null) {
              inStockRate = (
                childRate *
                (childQuantity / Math.abs(quantity))
              ).toFixed(2);
            }

            // const stockJournalInObjet = {
            //   Date: parseDate("%d/%b/%Y"),
            //   VoucherType: parseDate("STN/%d%m%y/01"),
            //   "Item Name": fullName.replaceAll(/\(\w{10}\)/gm, ""),
            //   Unit: "Pcs",
            //   Godown: warehouse,
            //   Type: "in",
            //   Qty: Math.abs(quantity),
            //   Rate: inStockRate,
            // };

            const stockJournalInObject = getStockJournalEntryJson(
              parseDate("%d/%b/%Y"), // Date
              parseDate("STN/%d%m%y/01"), // vocher number
              fullName.replaceAll(/\(\w{10}\)/gm, ""), // item name
              warehouse, // godown
              "in", // type (in or out)
              Math.abs(quantity), // quantity (qty)
              inStockRate, // rate
              inStockRate * Math.abs(quantity) // amount (rate * qty)
            );

            stockJournalArray.push(stockJournalInObject);

            // const stockJournalOutObjet = {
            //   Date: parseDate("%d/%b/%Y"),
            //   VoucherType: parseDate("STN/%d%m%y/01"),
            //   "Item Name": childProductName.replaceAll(/\(\w{10}\)/gm, ""),
            //   Unit: "Pcs",
            //   Godown: childWarehouse,
            //   Type: "out",
            //   Qty: childQuantity,
            //   Rate: (
            //     (parseFloat(inStockRate) * Math.abs(quantity)) /
            //     childQuantity
            //   )?.toFixed(2),
            // };

            const outStockRate = (
              (parseFloat(inStockRate) * Math.abs(quantity)) /
              childQuantity
            )?.toFixed(2);

            const stockJournalOutObject = getStockJournalEntryJson(
              parseDate("%d/%b/%Y"), // Date
              parseDate("STN/%d%m%y/01"), // vocher number
              childProductName.replaceAll(/\(\w{10}\)/gm, ""), // item name
              childWarehouse, // godown
              "out", // type (in or out)
              Math.abs(childQuantity), // quantity (qty)
              outStockRate, // rate
              parseFloat(outStockRate) * Math.abs(childQuantity) // amount (rate * qty)
            );

            stockJournalArray.push(stockJournalOutObject);
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

  const stockJournalFileName = parseDate("stockJournal-%y%m%d%M%S.xlsx");
  await workbook.xlsx.writeFile(stockJournalFileName);

  return {
    status: "success",
    message: `${stockJournalFileName} created`,
  };
}

module.exports = generateStockJournalLightPacks;
