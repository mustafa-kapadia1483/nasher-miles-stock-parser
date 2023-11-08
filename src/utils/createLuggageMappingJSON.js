const Excel = require("exceljs");

async function createLuggageMappingJSON(excelFilePath) {
  try {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    const luggageMappingWorksheet = workbook.worksheets[0];

    const luggageMappingJSON = {};

    const luggageMappingWorksheetRows = luggageMappingWorksheet.getRows(
      2,
      luggageMappingWorksheet.rowCount
    );

    for (let luggageMappingWorksheetRow of luggageMappingWorksheetRows) {
      luggageMappingJSON[luggageMappingWorksheetRow.getCell(1).value] = {
        "parent sku": luggageMappingWorksheetRow.getCell(2).value,
        size: luggageMappingWorksheetRow.getCell(13).value,
        children: [
          {
            "child asin": luggageMappingWorksheetRow.getCell(3).value,
            "child sku": luggageMappingWorksheetRow.getCell(4).value,
          },
          {
            "child asin": luggageMappingWorksheetRow.getCell(5).value,
            "child sku": luggageMappingWorksheetRow.getCell(6).value,
          },
          {
            "child asin": luggageMappingWorksheetRow.getCell(7).value,
            "child sku": luggageMappingWorksheetRow.getCell(8).value,
          },
        ],
      };
    }

    var fs = require("fs");
    fs.writeFile(
      `${__dirname}/luggage-asin-parent-child-mapping.json`,
      JSON.stringify(luggageMappingJSON),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );

    return {
      status: "success",
      message: "Luggage parent child mapping file created",
    };
  } catch (error) {
    return {
      status: "failed",
      message:
        "Error occured while generating luggage parent child mapping " + error,
    };
  }
}

module.exports = createLuggageMappingJSON;
