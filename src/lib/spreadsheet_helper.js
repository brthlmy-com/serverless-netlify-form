class SpreadsheetHelper {
  constructor(googleSpreadsheet, sheetTitle) {
    this.spreadsheetService = googleSpreadsheet;
    this.sheetTitle = sheetTitle;
  }

  handle = async (sheetRow) => {
    await this.spreadsheetService.loadInfo();
    const sheet = this.spreadsheetService.sheetsByTitle[this.sheetTitle];
    if(sheet) {
      await sheet?.addRow(sheetRow);
    }
  };
}

export {SpreadsheetHelper};
