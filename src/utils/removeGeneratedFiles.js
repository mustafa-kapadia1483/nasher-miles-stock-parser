const fs = require("fs");
const path = require("path");

function removeGeneratedFiles() {
  try {
    // Get a list of all files in the folder
    const folderPath = `${__dirname}/generated_files`;
    const files = fs.readdirSync(folderPath);

    // Iterate through the files and delete each one
    files.forEach(file => {
      const filePath = path.join(folderPath, file);

      // Delete the file synchronously
      fs.unlinkSync(filePath);
    });

    return {
      status: "success",
      message: "All generated files have been deleted",
    };
  } catch (err) {
    console.error("Error deleting files:", err);
    return {
      status: "failed",
      message: `Error occured while deleting generated files: ${err}`,
    };
  }
}

module.exports = removeGeneratedFiles;
