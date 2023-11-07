function getStockJournalEntryJson(
  Date,
  vchNumber,
  itemName,
  Godown,
  Type,
  Qty,
  Rate,
  Amount,
  Unit = "Pcs",
  VoucherType = "Stock Journal"
) {
  return {
    Date,
    VoucherType,
    "Vch Number": vchNumber,
    "Item Name": itemName,
    Unit,
    Godown,
    Type,
    Qty,
    Rate,
    Amount,
  };
}

module.exports = getStockJournalEntryJson;
