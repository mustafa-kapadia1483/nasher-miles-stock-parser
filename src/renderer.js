const { ipcRenderer } = require("electron");
const warehouseStateMappingJson = require("./warehouse-state-mapping.json");

const uploadStockSummaryButton = document.getElementById(
  "upload-stock-summary-button"
);
const uploadLightsMappingExcelButton = document.querySelector(
  "#upload-lights-mapping-file-button"
);
const generateStockJournalLightPacksButton = document.querySelector(
  "#generate-stock-journal-light-packs-button"
);

const warehouseSelect = document.querySelector(`#warehouse-select`);

const warehouseNames = Object.keys(warehouseStateMappingJson);
for (let warehouseName of warehouseNames) {
  const option = document.createElement("option");
  option.value = warehouseName;
  option.textContent = warehouseName;
  warehouseSelect.append(option);
}

let selectedWarehouseName = "";

warehouseSelect.addEventListener("change", e => {
  selectedWarehouseName = e.target.selectedOptions[0].value;

  console.log(warehouseStateMappingJson[selectedWarehouseName]);
});

uploadLightsMappingExcelButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("showDialog");
  if (result.filePaths.length == 0) {
    return;
  }
  await ipcRenderer.invoke("createLightsMappingJSON", result.filePaths[0]);
});

generateStockJournalLightPacksButton.addEventListener("click", async () => {
  await ipcRenderer.invoke("generateStockJournalLightPacks");
});

uploadLightsMappingExcelButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("showDialog");
  if (result.filePaths.length == 0) {
    return;
  }
  await ipcRenderer.invoke("createLightsMappingJSON", result.filePaths[0]);
});

uploadStockSummaryButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("showDialog");
  if (result.filePaths.length == 0) {
    return;
  }

  uploadStockSummaryButton.disabled = true;
  const loader = createLoader(uploadStockSummaryButton);

  const extractedData = await ipcRenderer.invoke(
    "generateStockSummaryJson",
    result.filePaths,
    warehouseStateMappingJson[selectedWarehouseName] ?? []
  );

  uploadStockSummaryButton.disabled = false;
  loader.remove();
});

function createTable(extractedData) {
  const table = document.createElement("table");
  table.className = "ms-table ms-striped mt-5";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const theadTr = document.createElement("tr");
  Object.keys(extractedData[0]).forEach(key => {
    const th = document.createElement("th");
    th.innerText = key.replace(/([a-z])([A-Z])/g, "$1 $2");
    th.style.textTransform = "capitalize";
    theadTr.append(th);
  });

  thead.append(theadTr);

  for (data of extractedData) {
    const tr = document.createElement("tr");

    for (const value of Object.values(data)) {
      const td = document.createElement("td");
      td.innerText = value;
      tr.append(td);
    }

    tbody.append(tr);
  }
  table.append(thead);
  table.append(tbody);

  return table;
}

function createButton(buttonText, className) {
  const button = document.createElement("button");
  button.textContent = buttonText;
  button.className = className;

  return button;
}

function createInputGroup(labelText, id, type, value) {
  const div = document.createElement("div");
  div.className = "ms-form-group";

  const label = document.createElement("label");
  label.textContent = labelText;
  label.htmlFor = id;

  div.append(label);

  const input = document.createElement("input");
  input.type = type;
  input.id = id;
  input.value = value;

  div.append(input);

  return div;
}

function createCol() {
  const col = document.createElement("div");
  col.className = "col";
  return col;
}

function createDialogBox(open = true) {
  const dialog = document.createElement("dialog");
  dialog.setAttribute("open", open);

  return dialog;
}

function createLoader(parent = document.body) {
  const div = document.createElement("div");
  div.style.display = "inline-block";
  div.dataset.loader = "timer";
  parent.append(div);
  return div;
}
