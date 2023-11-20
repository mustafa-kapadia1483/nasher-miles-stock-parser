const Excel = require("exceljs");

async function createProductFamilyMappingJSON(excelFilePath) {
  try {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    const productFamilyMappingWorksheet = workbook.worksheets[0];

    const productFamilyMapping = [];

    const productFamilyMappingWorksheetRows =
      productFamilyMappingWorksheet.getRows(
        2,
        productFamilyMappingWorksheet.rowCount
      );

    for (let lightsMappingWorksheetRow of productFamilyMappingWorksheetRows) {
      let productFamilyArray = [];

      lightsMappingWorksheetRow.eachCell((cell, colNumber) => {
        if (colNumber != 1) {
          productFamilyArray.push(cell.value);
        }
      });

      if (productFamilyArray.length == 0) continue;
      productFamilyMapping.push(productFamilyArray);
    }

    var fs = require("fs");
    fs.writeFile(
      `${__dirname}/product-family-mapping.json`,
      JSON.stringify(productFamilyMapping),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );

    return {
      status: "success",
      message: "Lights parent child mapping file created",
    };
  } catch (error) {
    return {
      status: "failed",
      message:
        "Error occured while generating lights parent child mapping " + error,
    };
  }
}

module.exports = createProductFamilyMappingJSON;
