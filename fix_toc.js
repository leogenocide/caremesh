import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.resolve('A_Social_Coordination_Network_Project_Report.pdf');
const htmlPath = path.resolve('project_report_source.html');

let html = fs.readFileSync(htmlPath, 'utf8');

// Align all TOC entries with exact pages in the 29-page document:
const fixes = [
  ['2.8.1 What is a Modern Web Application?</span><span class="toc-leader"></span><span class="toc-page">17</span>', '2.8.1 What is a Modern Web Application?</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.2 Web System Architecture (Client-Server 3-Tier Pipeline)</span><span class="toc-leader"></span><span class="toc-page">17</span>', '2.8.2 Web System Architecture (Client-Server 3-Tier Pipeline)</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.3 Application Components</span><span class="toc-leader"></span><span class="toc-page">18</span>', '2.8.3 Application Components</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.4 React Component Lifecycle & State Management</span><span class="toc-leader"></span><span class="toc-page">18</span>', '2.8.4 React Component Lifecycle & State Management</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.5 Data Flow & Request-Response Pipeline</span><span class="toc-leader"></span><span class="toc-page">18</span>', '2.8.5 Data Flow & Request-Response Pipeline</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.6 Asynchronous Operations & Event Loops</span><span class="toc-leader"></span><span class="toc-page">19</span>', '2.8.6 Asynchronous Operations & Event Loops</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.7 Security Features of Web Application</span><span class="toc-leader"></span><span class="toc-page">19</span>', '2.8.7 Security Features of Web Application</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['2.8.8 Evolution of Social Coordination Platforms</span><span class="toc-leader"></span><span class="toc-page">19</span>', '2.8.8 Evolution of Social Coordination Platforms</span><span class="toc-leader"></span><span class="toc-page">12</span>'],
  ['2.8.9 Core System Features</span><span class="toc-leader"></span><span class="toc-page">20</span>', '2.8.9 Core System Features</span><span class="toc-leader"></span><span class="toc-page">12</span>'],
  ['2.10.1 Frontend Runtime (React 19, Vite, Leaflet)</span><span class="toc-leader"></span><span class="toc-page">20</span>', '2.10.1 Frontend Runtime (React 19, Vite, Leaflet)</span><span class="toc-leader"></span><span class="toc-page">12</span>'],
  ['2.10.2 Backend Runtime & Storage (Node.js, Express 5, Better-SQLite3)</span><span class="toc-leader"></span><span class="toc-page">21</span>', '2.10.2 Backend Runtime & Storage (Node.js, Express 5, Better-SQLite3)</span><span class="toc-leader"></span><span class="toc-page">12</span>'],
  ['3.2.1 Technical Feasibility</span><span class="toc-leader"></span><span class="toc-page">22</span>', '3.2.1 Technical Feasibility</span><span class="toc-leader"></span><span class="toc-page">13</span>'],
  ['3.2.2 Operational & Economic Feasibility</span><span class="toc-leader"></span><span class="toc-page">23</span>', '3.2.2 Operational & Economic Feasibility</span><span class="toc-leader"></span><span class="toc-page">13</span>'],
  ['3.2.3 Legal & Ethical Feasibility</span><span class="toc-leader"></span><span class="toc-page">23</span>', '3.2.3 Legal & Ethical Feasibility</span><span class="toc-leader"></span><span class="toc-page">13</span>'],
  ['4.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">24</span>', '4.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">14</span>'],
  ['5.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">27</span>', '5.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">20</span>'],
  ['5.2 Input Design</span><span class="toc-leader"></span><span class="toc-page">27</span>', '5.2 Input Design</span><span class="toc-leader"></span><span class="toc-page">20</span>'],
  ['5.3 Physical Design</span><span class="toc-leader"></span><span class="toc-page">27</span>', '5.3 Physical Design</span><span class="toc-leader"></span><span class="toc-page">20</span>'],
  ['6.1 System Testing</span><span class="toc-leader"></span><span class="toc-page">31</span>', '6.1 System Testing</span><span class="toc-leader"></span><span class="toc-page">26</span>'],
  ['6.1.1 Testing Strategies & Environments</span><span class="toc-leader"></span><span class="toc-page">31</span>', '6.1.1 Testing Strategies & Environments</span><span class="toc-leader"></span><span class="toc-page">26</span>'],
  ['6.1.2 Test Cases & Execution Matrix</span><span class="toc-leader"></span><span class="toc-page">32</span>', '6.1.2 Test Cases & Execution Matrix</span><span class="toc-leader"></span><span class="toc-page">27</span>']
];

for (const [find, replace] of fixes) {
  html = html.replace(find, replace);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Fixed all inner TOC numbers in HTML!');

console.log('Re-compiling PDF via Chrome headless...');
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + outputPath,
  htmlPath
]);

const stats = fs.statSync(outputPath);
console.log('Re-compilation complete! Final size:', (stats.size / 1024).toFixed(2), 'KB');

const artifactDest = 'C:\\\\Users\\\\eunik\\\\.gemini\\\\antigravity\\\\brain\\\\9d913a36-b3f4-4659-bbd7-238b5d7f38a8\\\\A_Social_Coordination_Network_Project_Report.pdf';
fs.copyFileSync(outputPath, artifactDest);
console.log('Artifact synchronized successfully.');
