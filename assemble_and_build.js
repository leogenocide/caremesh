import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

import { styles } from './report_src/styles.js';
import { preamble } from './report_src/preamble.js';
import { chapter1 } from './report_src/chapter1.js';
import { chapter2 } from './report_src/chapter2.js';
import { chapter3 } from './report_src/chapter3.js';
import { chapter4 } from './report_src/chapter4.js';
import { chapter5 } from './report_src/chapter5.js';
import { chapter6 } from './report_src/chapter6.js';
import { chapter7_8 } from './report_src/chapter7_8.js';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.resolve('A_Social_Coordination_Network_Project_Report.pdf');
const htmlPath = path.resolve('project_report_source.html');

console.log('--- ASSEMBLING 40+ PAGE COMPREHENSIVE PROJECT REPORT ---');

// Build HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>A Social Coordination Network &ndash; Academic Project Report</title>
  <style>
${styles}
  </style>
</head>
<body>
${preamble}
${chapter1}
${chapter2}
${chapter3}
${chapter4}
${chapter5}
${chapter6}
${chapter7_8}
</body>
</html>`;

// Verify forbidden word
const lowerHtml = fullHtml.toLowerCase();
if (lowerHtml.includes('caremesh')) {
  console.warn('⚠️ WARNING: Found "caremesh" in generated HTML! Cleaning occurrences...');
}
const sanitizedHtml = fullHtml.replace(/CareMesh/gi, 'A Social Coordination Network');

fs.writeFileSync(htmlPath, sanitizedHtml, 'utf8');
console.log('project_report_source.html written successfully! Size:', fs.statSync(htmlPath).size, 'bytes');

console.log('Compiling initial PDF with Chrome headless...');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + outputPath,
  htmlPath
]);

if (fs.existsSync(outputPath)) {
  const stats = fs.statSync(outputPath);
  const pdfBytes = fs.readFileSync(outputPath);
  const pageMatches = pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 0;
  console.log(' PDF compiled successfully!');
  console.log(' File Size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
  console.log(' TOTAL PAGE COUNT:', pageCount, 'pages');
  
  if (pageCount < 40) {
    console.error('❌ ERROR: Page count is less than 40 pages! Current:', pageCount);
  } else {
    console.log(' SUCCESS: Page count exceeds requirement (>= 40 pages)!');
  }
} else {
  console.error('❌ Failed to compile PDF');
  process.exit(1);
}
