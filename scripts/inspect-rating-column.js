// Open this script in Apps Script Editor for your Google Sheet
// This will show you the exact column headers and sample data

function inspectSheetStructure() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form responses 1');
  
  if (!sheet) {
    Logger.log('Sheet "Form responses 1" not found!');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  Logger.log('=== SHEET HEADERS ===');
  headers.forEach((header, index) => {
    Logger.log(`Column ${index}: "${header}"`);
  });
  
  Logger.log('\n=== SAMPLE ROW (Row 2) ===');
  if (data.length > 1) {
    const sampleRow = data[1];
    headers.forEach((header, index) => {
      Logger.log(`${header}: ${sampleRow[index]}`);
    });
  }
  
  Logger.log('\n=== LOOKING FOR RATING COLUMN ===');
  headers.forEach((header, index) => {
    if (header.toLowerCase().includes('clarity') || 
        header.toLowerCase().includes('tutor') || 
        header.toLowerCase().includes('mentor provide')) {
      Logger.log(`Found at Column ${index}: "${header}"`);
      Logger.log(`Sample value: ${data[1] ? data[1][index] : 'N/A'}`);
    }
  });
}
