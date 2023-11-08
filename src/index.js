const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Notification,
  webContents,
} = require("electron");
const path = require("path");

const generateStockSummaryJson = require("./utils/generateStockSummaryJson");
const createLightsMappingJSON = require("./utils/createLightsMappingJSON");
const generateStockJournalLightPacks = require("./utils/generateStockJournalLightPacks");
const generateStockJournalWarehouseAliasNegativeAdjustment = require("./utils/generateStockJournalWarehouseAliasNegativeAdjustment");
const createLuggageMappingJSON = require("./utils/createLuggageMappingJSON");
const generateStockJournalLuggagePacks = require("./utils/generateStockJournalLuggagePacks");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Code to show dialog box for uploading pdf
ipcMain.handle("showDialog", async () => {
  const result = await dialog.showOpenDialog({
    buttonLabel: "Upload Excel",
    filters: [
      {
        name: "xls",
        extensions: ["xls", "xlsx"],
      },
    ],
    properties: ["openFile", "dontAddToRecent", "multiSelections"],
  });

  return result;
});

ipcMain.handle(
  "generateStockSummaryJson",
  async (e, pdfFilePath, warehouseAliasList) => {
    const result = await generateStockSummaryJson(
      pdfFilePath,
      warehouseAliasList
    );
    console.log({ result });
    return result;
  }
);

ipcMain.handle("createLightsMappingJSON", async (e, excelFilePath) => {
  const result = await createLightsMappingJSON(excelFilePath);
  return result;
});
ipcMain.handle("createLuggageMappingJSON", async (e, excelFilePath) => {
  const result = await createLuggageMappingJSON(excelFilePath);
  return result;
});

ipcMain.handle("generateStockJournalLightPacks", async e => {
  const result = await generateStockJournalLightPacks();
  console.log(result);
  return result;
});

ipcMain.handle("generateStockJournalLuggagePacks", async e => {
  const result = await generateStockJournalLuggagePacks();
  console.log(result);
  return result;
});

ipcMain.handle(
  "generateStockJournalWarehouseAliasNegativeAdjustment",
  async e => {
    const result = await generateStockJournalWarehouseAliasNegativeAdjustment();
    return result;
  }
);
