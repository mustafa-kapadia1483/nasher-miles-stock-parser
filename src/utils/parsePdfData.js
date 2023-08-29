const parseDate = require("./strftime");

const DATE_REGEX = /(\d{1,4})[\p{Dash}.\/](\d{1,2})[\p{Dash}.\/](\d{2,4})/gmu;

function addDays(date, days) {
  var result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days
  );

  return result;
}

function getEndDate(date) {
  const warrantyEndDate = addDays(date, 365);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log({ date, warrantyEndDate });

  if (warrantyEndDate.getTime() > today.getTime()) {
    let extendedWarrantEndDate = addDays(warrantyEndDate, 182);

    return parseDate("%b %d, %Y", extendedWarrantEndDate);
  } else {
    return "Not Applicable";
  }
}

function decodeAndExtractText(text, regex = null) {
  text = decodeURIComponent(text);
  if (regex == null) {
    return text;
  }

  let match = text.match(regex);

  if (match == null) {
    return "";
  }

  text = match[0];

  return text;
}

function parseNasherMilesInvoice(Texts) {
  let orderId = Texts[2].R[0].T;
  orderId = decodeAndExtractText(orderId, /[\d]+\p{Dash}[\d]+/gmu);

  let invoiceDate = Texts[3].R[0].T;
  invoiceDate = decodeAndExtractText(invoiceDate, DATE_REGEX);

  // Finding index of total text & then getting total invoice value by the next array element in Texts
  const TOTAL_TEXT_INDEX = Texts.findIndex(({ R }) => R[0].T == "Total");
  let totalInvoiceAmount = decodeAndExtractText(
    Texts[TOTAL_TEXT_INDEX + 1].R[0].T
  );
  totalInvoiceAmount = totalInvoiceAmount.replaceAll(/[^\d]/g, "");

  const BILL_TO_TEXT_INDEX = Texts.findIndex(({ R }) =>
    R[0].T.startsWith("Bill")
  );
  let billToName = decodeAndExtractText(Texts[BILL_TO_TEXT_INDEX + 1].R[0].T);

  const INVOICE_TEXT_INDEX = Texts.findIndex(({ R }) =>
    R[0].T.startsWith("Invoice")
  );
  let billToAddressArray = Texts.slice(
    BILL_TO_TEXT_INDEX + 2,
    INVOICE_TEXT_INDEX
  );

  let billToState = "",
    billToZipCode = "";
  for (let i = 0; i < billToAddressArray.length; i++) {
    billToAddressArray[i] = decodeAndExtractText(billToAddressArray[i].R[0].T);

    let stateZip = decodeAndExtractText(
      billToAddressArray[i],
      /[\w\s]+\p{Dash}\s+\d{6}/gmu
    );
    if (stateZip.length > 0) {
      billToState = stateZip.match(/[\w\s]+/gmu)[0]?.trim();
      billToZipCode = stateZip.match(/\d{6}/gmu)[0];
    }
  }

  let billToAddress = billToAddressArray.join(" ");

  let sku = "";
  let dataPostInvoiceText = Texts.slice(INVOICE_TEXT_INDEX + 1);

  for (let i = 0; i < dataPostInvoiceText.length; i++) {
    let { x, R } = dataPostInvoiceText[i];

    if (x < 10 && R[0].T.startsWith("SKU") == false) {
      sku += decodeAndExtractText(R[0].T);
    } else if (decodeAndExtractText(R[0].T).includes("%")) {
      sku += ", ";
    }
  }

  // Remove extra , & space
  sku = sku.replace(/,\s+$/, "");

  return {
    orderId,
    invoiceDate,
    totalInvoiceAmount,
    billToName,
    billToState,
    billToZipCode,
    billToAddress,
    sku,
  };
}

function parseAmazonInvoice(Texts) {
  const ORDER_NUMBER_TEXT_INDEX = Texts.findIndex(({ R }) =>
    decodeAndExtractText(R[0].T).toLowerCase().includes("order number")
  );

  let orderId = decodeAndExtractText(
    Texts[ORDER_NUMBER_TEXT_INDEX + 1].R[0].T,
    /\d+\p{Dash}\d+\p{Dash}\d+/gmu
  );

  const INVOICE_DATE_TEXT_INDEX = Texts.findIndex(({ R }) =>
    decodeAndExtractText(R[0].T).toLowerCase().includes("invoice date")
  );

  let invoiceDate = decodeAndExtractText(
    Texts[INVOICE_DATE_TEXT_INDEX + 1].R[0].T,
    DATE_REGEX
  );

  const SHIPPING_ADDRESS_INDEX = Texts.findIndex(({ R }) =>
    decodeAndExtractText(R[0].T).toLowerCase().includes("shipping address")
  );

  let billToName = decodeAndExtractText(
    Texts[SHIPPING_ADDRESS_INDEX + 1].R[0].T
  );

  let ut_code_text_count = 0;
  let UT_CODE_TEXT_INDEX = -1;
  for (let i = 0; i < Texts.length; i++) {
    const { R } = Texts[i];
    if (decodeAndExtractText(R[0].T).toLowerCase().includes("ut code")) {
      ut_code_text_count++;
    }
    if (ut_code_text_count == 2) {
      UT_CODE_TEXT_INDEX = i;
      break;
    }
  }

  console.log({ UT_CODE_TEXT_INDEX });

  let billToAddressArray = Texts.slice(
    SHIPPING_ADDRESS_INDEX + 3,
    UT_CODE_TEXT_INDEX
  );

  console.log(SHIPPING_ADDRESS_INDEX);

  let billToState = "",
    billToZipCode = "";
  for (let i = 0; i < billToAddressArray.length; i++) {
    billToAddressArray[i] = decodeAndExtractText(billToAddressArray[i].R[0].T);

    let stateZip = decodeAndExtractText(
      billToAddressArray[i],
      /[\w\s]+,\s+\d{6}/gmu
    );
    if (stateZip.length > 0) {
      billToState = stateZip.match(/[\w\s]+/gmu)[0]?.trim();
      billToZipCode = stateZip.match(/\d{6}/gmu)[0];
    }
  }

  let billToAddress = billToAddressArray.join(" ");

  let skuAr = [];
  let asinAr = [];

  let productDescription = "";
  let productDescriptionFlag = false;
  for (let i = 0; i < Texts.length; i++) {
    const { R } = Texts[i];

    let text = decodeAndExtractText(R[0].T);

    if (text.startsWith("Nasher")) {
      productDescriptionFlag = true;
    } else if (text.includes("GST")) {
      console.log({ productDescription });
      productDescriptionFlag = false;
      /* Regex to match asin |B0BTDN9BB2*/
      let asin = productDescription.match(/(?<=[\|])([\s\w]+)/g);
      /* Regex to match sku |( LUG_NM_1228_Istanbul_Cream&Brown_S3 )*/
      let sku = productDescription.match(/\(([\w_&\s]+)\)/g);
      if (asin) {
        asinAr.push(asin.at(-1));
      }
      if (sku) {
        skuAr.push(sku.at(-1)?.replaceAll(/[/(/)]/g, ""));
      }
      productDescription = "";
      continue;
    }

    if (productDescriptionFlag) {
      productDescription += text;
    }
  }

  // Remove extra , & space
  let sku = skuAr.join(", ");
  let asin = asinAr.join(", ");

  let dateAr = invoiceDate.split(/[\p{Dash}.\/]/);
  const invoiceDateObj = new Date(
    dateAr.at(-1),
    dateAr.at(-2) - 1,
    dateAr.at(-3)
  );
  invoiceDate = parseDate("%b %d, %Y", invoiceDateObj);
  let endDate = getEndDate(invoiceDateObj);

  const AMOUNT_IN_WORDS_TEXT_INDEX = Texts.findIndex(({ R }) =>
    decodeAndExtractText(R[0].T).toLowerCase().includes("amount in words")
  );

  let totalInvoiceAmount = decodeAndExtractText(
    Texts[AMOUNT_IN_WORDS_TEXT_INDEX - 1].R[0].T
  );
  totalInvoiceAmount = totalInvoiceAmount.replaceAll(/[^\d.]+/g, "");

  return {
    orderId,
    invoiceDate,
    endDate,
    billToName,
    billToState,
    billToZipCode,
    billToAddress,
    sku,
    asin,
    totalInvoiceAmount,
  };
}

async function parsePdfData(filePath) {
  const PDFParser = await import("pdf2json");
  const pdfParser = new PDFParser.default();

  const extractedData = [];
  let extractedObj = {};

  let platform = "";

  pdfParser.on("pdfParser_dataError", errData =>
    console.error(errData.parserError)
  );

  async function readPDF() {
    return new Promise((resolve, reject) => {
      pdfParser.on("pdfParser_dataReady", pdfData => {
        // pdfData.Pages.forEach(page => {
        //   // console.log(page);

        //
        // });

        const { Texts } = pdfData.Pages[0];

        var fs = require("fs");
        fs.writeFile("test.txt", JSON.stringify(Texts), function (err) {
          if (err) {
            console.log(err);
          }
        });

        if (
          decodeAndExtractText(Texts[0].R[0].T).includes(
            "Thank you for shopping with us"
          )
        ) {
          platform = "Nasher Miles";
          extractedObj = parseNasherMilesInvoice(Texts);
        } else if (
          Texts.some(({ R }) => decodeAndExtractText(R[0].T).includes("Amazon"))
        ) {
          platform = "Amazon";
          extractedObj = parseAmazonInvoice(Texts);
        }

        if (
          Object.values(extractedObj).every(
            value => value === null || value === undefined
          ) ||
          Object.keys(extractedObj).length === 0
        ) {
          console.log(extractedObj);
          resolve(`Could not parse values from ${filePath}`);
        }

        const {
          orderId,
          invoiceDate,
          endDate,
          billToName,
          billToState,
          billToZipCode,
          billToAddress,
          sku,
          asin,
          totalInvoiceAmount,
        } = extractedObj;

        resolve({
          Name: billToName,
          Platform: platform,
          "Order Number": orderId,
          SKU: sku,
          "Invoice Date": invoiceDate,
          "End Date": endDate,
          ASIN: asin,
          State: billToState,
          "Zip Code": billToZipCode,
          Value: totalInvoiceAmount,
        });
      });
      pdfParser.on("pdfParser_dataError", reject);
    });
  }

  pdfParser.loadPDF(filePath);
  extractedObj = await readPDF();

  console.log(extractedObj);

  return extractedObj;
}

module.exports = parsePdfData;
