const Excel = require("exceljs");

async function createLightsMappingJSON(excelFilePath) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(excelFilePath);
  const lightsMappingWorksheet = workbook.worksheets[0];

  const lightsMappingJSON = {};

  const lightsMappingWorksheetRows = lightsMappingWorksheet.getRows(
    2,
    lightsMappingWorksheet.rowCount
    // stockSummaryWorksheet.rowCount
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
    "lights-asin-parent-child-mapping.json",
    JSON.stringify(lightsMappingJSON),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );

  return "success";
}

module.exports = createLightsMappingJSON;
