const Excel = require("exceljs");

async function createLightsMappingJSON(excelFilePath) {
  try {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    const lightsMappingWorksheet = workbook.worksheets[0];

    const lightsMappingJSON = {};

    const lightsMappingWorksheetRows = lightsMappingWorksheet.getRows(
      2,
      lightsMappingWorksheet.rowCount
    );

    for (let lightsMappingWorksheetRow of lightsMappingWorksheetRows) {
      lightsMappingJSON[lightsMappingWorksheetRow.getCell(1).value] = {
        "parent sku": lightsMappingWorksheetRow.getCell(2).value,
        "child asin": lightsMappingWorksheetRow.getCell(3).value,
        "child sku": lightsMappingWorksheetRow.getCell(4).value,
      };
    }

    var fs = require("fs");
    fs.writeFile(
      `${__dirname}/lights-asin-parent-child-mapping.json`,
      JSON.stringify(lightsMappingJSON),
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

module.exports = createLightsMappingJSON;
