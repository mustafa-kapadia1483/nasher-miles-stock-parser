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

async function parsePdfData(filePath) {
  const PDFParser = await import("pdf2json");
  const pdfParser = new PDFParser.default();

  pdfParser.on("pdfParser_dataError", errData =>
    console.error(errData.parserError)
  );

  const extractedData = new Promise((resolve, reject) => {
    pdfParser.on("pdfParser_dataReady", pdfData => {
      const extractedData = [];

      pdfData.Pages.forEach(page => {
        const { Texts } = page;

        var fs = require("fs");
        fs.writeFile("test.txt", JSON.stringify(Texts), function (err) {
          if (err) {
            console.log(err);
          }
        });

        let orderId = Texts[2].R[0].T;
        orderId = decodeAndExtractText(orderId, /[\d]+-[\d]+/gm);

        let invoiceDate = Texts[3].R[0].T;
        invoiceDate = decodeAndExtractText(
          invoiceDate,
          /\d{4}\p{Dash}\d{2}\p{Dash}\d{2}/gmu
        );

        const TOTAL_TEXT_INDEX = Texts.findIndex(({ R }) => R[0].T == "Total");
        let totalInvoiceAmount = decodeAndExtractText(
          Texts[TOTAL_TEXT_INDEX + 1].R[0].T
        );
        totalInvoiceAmount = totalInvoiceAmount.replaceAll(/[^\d]/g, "");

        const BILL_TO_TEXT_INDEX = Texts.findIndex(({ R }) =>
          R[0].T.startsWith("Bill")
        );
        let billToName = decodeAndExtractText(
          Texts[BILL_TO_TEXT_INDEX + 1].R[0].T
        );

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
          billToAddressArray[i] = decodeAndExtractText(
            billToAddressArray[i].R[0].T
          );

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

        extractedData.push({
          orderId,
          invoiceDate,
          totalInvoiceAmount,
          billToName,
          billToState,
          billToZipCode,
          billToAddress,
          sku,
        });
      });

      // console.log(extractedData);
      resolve(extractedData);
    });
  });

  pdfParser.loadPDF(filePath);

  return extractedData;
}

module.exports = parsePdfData;
