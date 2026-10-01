import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('project_report_source.html');
const screenshotPath = path.resolve('table_verification_screenshot.png');

console.log('Taking screenshot of rendered HTML to verify zero table clipping...');

// We can create a small test HTML focusing specifically on Section 5.4 table with exact page styles
const html = fs.readFileSync(htmlPath, 'utf8');
const sec54Idx = html.indexOf('<h2>5.4 Logical Design');
const endTableIdx = html.indexOf('<h2>5.5 Output Design');
const tableSlice = html.substring(sec54Idx, endTableIdx);

const testPage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 portrait; margin: 18mm 14mm 18mm 14mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 8.2pt; padding: 20px; max-width: 800px; }
    table { width: 100% !important; max-width: 100% !important; table-layout: fixed !important; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; vertical-align: top; word-break: break-word !important; overflow-wrap: break-word !important; }
    th { background: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>
  ${tableSlice}
</body>
</html>`;

const tmpHtml = path.resolve('temp_sec54_check.html');
fs.writeFileSync(tmpHtml, testPage, 'utf8');

execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--window-size=900,1200',
  '--screenshot=' + screenshotPath,
  tmpHtml
]);

console.log('Screenshot captured:', screenshotPath, 'Size:', fs.statSync(screenshotPath).size);
fs.unlinkSync(tmpHtml);
