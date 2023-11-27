const { ipcRenderer } = require("electron");
const warehouseStateMappingJson = require("./warehouse-state-mapping.json");

const uploadStockSummaryButton = document.getElementById(
  "upload-stock-summary-button"
);
const uploadLightsMappingExcelButton = document.querySelector(
  "#upload-lights-mapping-file-button"
);
const uploadLuggageMappingExcelButton = document.querySelector(
  "#upload-luggage-set-mapping-file-button"
);
const uploadProductFamilyMappingExcelButton = document.querySelector(
  "#upload-product-family-mapping-file-button"
);

const generateStockJournalLightPacksButton = document.querySelector(
  "#generate-stock-journal-light-packs-button"
);
const generateStockJournalLuggagePacksButton = document.querySelector(
  "#generate-stock-journal-luggage-packs-button"
);
const generateStockJournalNegativeStockWarehouseAdjustmentButton =
  document.querySelector(
    "#generate-stock-journal-negative-stock-warehouse-adjustment-button"
  );
const generateStockJournalProductFamilyAdjustmentButton =
  document.querySelector(
    "#generate-stock-journal-product-family-adjustment-button"
  );

const removeGeneratedFilesButton = document.querySelector(
  "#remove-generated-files-button"
);

const stockJournalDatePicker = document.querySelector(`#stock-journal-date`);
stockJournalDatePicker.valueAsDate = new Date();

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
  const createLightsMappingJSONResult = await ipcRenderer.invoke(
    "createLightsMappingJSON",
    result.filePaths[0]
  );

  if (createLightsMappingJSONResult.status == "failed") {
    createAlert(
      `Lights Mapping JSON creation Failed, ${createLightsMappingJSONResult.message}`
    );
  } else {
    createAlert(
      `Lights Mapping JSON creation Success, ${createLightsMappingJSONResult.message}`
    );
  }
});

uploadLuggageMappingExcelButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("showDialog");
  if (result.filePaths.length == 0) {
    return;
  }
  const createLuggageMappingJSONResult = await ipcRenderer.invoke(
    "createLuggageMappingJSON",
    result.filePaths[0]
  );

  if (createLuggageMappingJSONResult.status == "failed") {
    createAlert(
      `Luggage Mapping JSON creation Failed, ${createLuggageMappingJSONResult.message}`
    );
  } else {
    createAlert(
      `Luggage Mapping JSON creation Success, ${createLuggageMappingJSONResult.message}`
    );
  }
});

uploadProductFamilyMappingExcelButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("showDialog");
  if (result.filePaths.length == 0) {
    return;
  }
  const createProductFamilyMappingJSONResult = await ipcRenderer.invoke(
    "createProductFamilyMappingJSON",
    result.filePaths[0]
  );

  if (createProductFamilyMappingJSONResult.status == "failed") {
    createAlert(
      `Product Mapping JSON creation Failed, ${createProductFamilyMappingJSONResult.message}`
    );
  } else {
    createAlert(
      `Product Mapping JSON creation Success, ${createProductFamilyMappingJSONResult.message}`
    );
  }
});

generateStockJournalLightPacksButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke(
    "generateStockJournalLightPacks",
    stockJournalDatePicker.valueAsDate
  );

  if (result.status == "failed") {
    createAlert(`Stock Journal creation Failed, ${result.message}`);
  } else {
    createAlert(`Stock Journal creation Success, ${result.message}`);
  }
});

generateStockJournalLuggagePacksButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke(
    "generateStockJournalLuggagePacks",
    stockJournalDatePicker.valueAsDate
  );

  if (result.status == "failed") {
    createAlert(`Stock Journal creation Failed, ${result.message}`);
  } else {
    createAlert(`Stock Journal creation Success, ${result.message}`);
  }
});

generateStockJournalNegativeStockWarehouseAdjustmentButton.addEventListener(
  "click",
  async () => {
    const result = await ipcRenderer.invoke(
      "generateStockJournalWarehouseAliasNegativeAdjustment",
      stockJournalDatePicker.valueAsDate
    );

    if (result.status == "failed") {
      createAlert(`Stock Journal creation Failed, ${result.message}`);
    } else {
      createAlert(`Stock Journal creation Success, ${result.message}`);
    }
  }
);

generateStockJournalProductFamilyAdjustmentButton.addEventListener(
  "click",
  async () => {
    const result = await ipcRenderer.invoke(
      "generateStockJournalProductFamilyAdjustment",
      stockJournalDatePicker.valueAsDate
    );

    if (result.status == "failed") {
      createAlert(`Stock Journal creation Failed, ${result.message}`);
    } else {
      createAlert(`Stock Journal creation Success, ${result.message}`);
    }
  }
);

removeGeneratedFilesButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("removeGeneratedFiles");

  if (result.status == "failed") {
    createAlert(`Failed, ${result.message}`);
  } else {
    createAlert(`Success, ${result.message}`);
  }
});

uploadStockSummaryButton.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("showDialog");
  if (result.filePaths.length == 0) {
    return;
  }

  uploadStockSummaryButton.disabled = true;
  const loader = createLoader(uploadStockSummaryButton);

  const generateStockSummaryJsonResult = await ipcRenderer.invoke(
    "generateStockSummaryJson",
    result.filePaths[0],
    warehouseStateMappingJson[selectedWarehouseName] ?? []
  );

  if (generateStockSummaryJsonResult.status == "failed") {
    createAlert(`Parsing Failed, ${generateStockSummaryJsonResult.message}`);
  } else {
    createAlert(`Parsing Success, ${generateStockSummaryJsonResult.message}`);
  }

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
  div.className = "ms-loading";
  parent.append(div);
  return div;
}

function createAlert(message, type) {
  const alertContainer = document.querySelector(".alert-container");
  const alert = document.createElement("div");
  alert.className = "ms-alert";

  const p = document.createElement("p");
  const icon = document.createElement("i");

  switch (type) {
    case "success":
      alert.style.backgroundColor = "green";
      break;
    case "failed":
      alert.style.backgroundColor = "green";
      break;
  }
  p.textContent = message;

  alertContainer.append(alert);
  alert.append(p);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}
