// ============================================
// Google Apps Script - Sheet Inspector & Data Viewer
// ============================================
// HOW TO USE:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Copy this entire file and paste it
// 4. Save (Ctrl+S)
// 5. Run: inspectSheet() to see your columns
// 6. Check View → Logs to see the output
// ============================================

/**
 * Inspect the sheet structure and show all columns and sample data
 * This helps you understand what fields you have
 */
function inspectSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    Logger.log('❌ Sheet is empty');
    return;
  }
  
  const headers = data[0];
  const rowCount = data.length - 1; // Exclude header
  
  Logger.log('📊 SHEET INSPECTION REPORT');
  Logger.log('='.repeat(60));
  Logger.log(`Sheet Name: ${sheet.getName()}`);
  Logger.log(`Total Rows: ${rowCount} (excluding header)`);
  Logger.log(`Total Columns: ${headers.length}`);
  Logger.log('='.repeat(60));
  Logger.log('\n📋 COLUMN HEADERS:');
  Logger.log('='.repeat(60));
  
  headers.forEach((header, index) => {
    Logger.log(`Column ${index + 1}: "${header}"`);
  });
  
  Logger.log('\n' + '='.repeat(60));
  Logger.log('📝 SAMPLE DATA (First 3 rows):');
  Logger.log('='.repeat(60));
  
  // Show first 3 data rows
  for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
    Logger.log(`\n--- Row ${i} ---`);
    headers.forEach((header, colIndex) => {
      const value = data[i][colIndex];
      if (value) {
        Logger.log(`  ${header}: ${value}`);
      }
    });
  }
  
  Logger.log('\n' + '='.repeat(60));
  Logger.log('✅ INSPECTION COMPLETE');
  Logger.log('='.repeat(60));
  Logger.log('\n💡 Next: Copy these column names to configure field mappings');
}

/**
 * View all column headers as JSON
 * Useful for copying to your configuration
 */
function getColumnsAsJSON() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = sheet.getDataRange().getValues()[0];
  
  const columnsObj = {};
  headers.forEach((header, index) => {
    const key = header.toString().trim()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    columnsObj[key] = header;
  });
  
  Logger.log('📋 COLUMNS AS JSON:');
  Logger.log(JSON.stringify(columnsObj, null, 2));
  Logger.log('\n📋 COLUMNS ARRAY:');
  Logger.log(JSON.stringify(headers, null, 2));
}

/**
 * Count total responses
 */
function countResponses() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rowCount = sheet.getLastRow() - 1; // Exclude header
  
  Logger.log(`📊 Total Responses: ${rowCount}`);
}

/**
 * Export all data as JSON (for manual import)
 */
function exportDataAsJSON() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    Logger.log('❌ Sheet is empty');
    return;
  }
  
  const headers = data[0];
  const jsonData = [];
  
  // Convert each row to object
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    
    jsonData.push(obj);
  }
  
  Logger.log('📦 DATA AS JSON:');
  Logger.log(JSON.stringify(jsonData, null, 2));
  
  // Also log first item as example
  if (jsonData.length > 0) {
    Logger.log('\n📝 FIRST ROW EXAMPLE:');
    Logger.log(JSON.stringify(jsonData[0], null, 2));
  }
}

/**
 * Create a custom menu in the spreadsheet
 * This makes it easier to run functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔍 Testimonials Tools')
    .addItem('📊 Inspect Sheet Structure', 'inspectSheet')
    .addItem('📋 View Columns as JSON', 'getColumnsAsJSON')
    .addItem('📝 Export Data as JSON', 'exportDataAsJSON')
    .addItem('🔢 Count Responses', 'countResponses')
    .addToUi();
}
