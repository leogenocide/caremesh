import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.resolve('A_Social_Coordination_Network_Project_Report.pdf');
const htmlPath = path.resolve('project_report_source.html');

let html = fs.readFileSync(htmlPath, 'utf8');

// Update Table of Contents to accurately reflect the actual page numbers
const replacements = [
  ['<span class="toc-title">1. INTRODUCTION</span><span class="toc-leader"></span><span class="toc-page">8</span>', '<span class="toc-title">1. INTRODUCTION</span><span class="toc-leader"></span><span class="toc-page">7</span>'],
  ['<span class="toc-title">1.1 Overview of the Project</span><span class="toc-leader"></span><span class="toc-page">8</span>', '<span class="toc-title">1.1 Overview of the Project</span><span class="toc-leader"></span><span class="toc-page">7</span>'],
  ['<span class="toc-title">1.2 Objective and Scope</span><span class="toc-leader"></span><span class="toc-page">9</span>', '<span class="toc-title">1.2 Objective and Scope</span><span class="toc-leader"></span><span class="toc-page">7</span>'],
  ['<span class="toc-title">1.2.1 Objective</span><span class="toc-leader"></span><span class="toc-page">9</span>', '<span class="toc-title">1.2.1 Objective</span><span class="toc-leader"></span><span class="toc-page">7</span>'],
  ['<span class="toc-title">1.2.2 Scope</span><span class="toc-leader"></span><span class="toc-page">10</span>', '<span class="toc-title">1.2.2 Scope</span><span class="toc-leader"></span><span class="toc-page">7</span>'],
  ['<span class="toc-title">1.3 Roles and Responsibility</span><span class="toc-leader"></span><span class="toc-page">11</span>', '<span class="toc-title">1.3 Roles and Responsibility</span><span class="toc-leader"></span><span class="toc-page">8</span>'],
  ['<span class="toc-title">2. REQUIREMENTS SPECIFICATIONS</span><span class="toc-leader"></span><span class="toc-page">13</span>', '<span class="toc-title">2. REQUIREMENTS SPECIFICATIONS</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">13</span>', '<span class="toc-title">2.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.1.1 Purpose</span><span class="toc-leader"></span><span class="toc-page">13</span>', '<span class="toc-title">2.1.1 Purpose</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.1.2 Scope</span><span class="toc-leader"></span><span class="toc-page">13</span>', '<span class="toc-title">2.1.2 Scope</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.1.3 Overview</span><span class="toc-leader"></span><span class="toc-page">13</span>', '<span class="toc-title">2.1.3 Overview</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.2 Problem Statement / Overall Description</span><span class="toc-leader"></span><span class="toc-page">13</span>', '<span class="toc-title">2.2 Problem Statement / Overall Description</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.3 Steps for Developing the Project</span><span class="toc-leader"></span><span class="toc-page">14</span>', '<span class="toc-title">2.3 Steps for Developing the Project</span><span class="toc-leader"></span><span class="toc-page">9</span>'],
  ['<span class="toc-title">2.4 Product Perspective</span><span class="toc-leader"></span><span class="toc-page">15</span>', '<span class="toc-title">2.4 Product Perspective</span><span class="toc-leader"></span><span class="toc-page">10</span>'],
  ['<span class="toc-title">2.5 Software Used</span><span class="toc-leader"></span><span class="toc-page">16</span>', '<span class="toc-title">2.5 Software Used</span><span class="toc-leader"></span><span class="toc-page">10</span>'],
  ['<span class="toc-title">2.6 Hardware Used</span><span class="toc-leader"></span><span class="toc-page">17</span>', '<span class="toc-title">2.6 Hardware Used</span><span class="toc-leader"></span><span class="toc-page">10</span>'],
  ['<span class="toc-title">2.7 Requirement to Run Application</span><span class="toc-leader"></span><span class="toc-page">17</span>', '<span class="toc-title">2.7 Requirement to Run Application</span><span class="toc-leader"></span><span class="toc-page">10</span>'],
  ['<span class="toc-title">2.8 Overview of Web Application</span><span class="toc-leader"></span><span class="toc-page">17</span>', '<span class="toc-title">2.8 Overview of Web Application</span><span class="toc-leader"></span><span class="toc-page">11</span>'],
  ['<span class="toc-title">2.9 Advantages and Disadvantages of Web Platform</span><span class="toc-leader"></span><span class="toc-page">20</span>', '<span class="toc-title">2.9 Advantages and Disadvantages of Web Platform</span><span class="toc-leader"></span><span class="toc-page">12</span>'],
  ['<span class="toc-title">2.10 Programming Environment</span><span class="toc-leader"></span><span class="toc-page">20</span>', '<span class="toc-title">2.10 Programming Environment</span><span class="toc-leader"></span><span class="toc-page">12</span>'],
  ['<span class="toc-title">3. SYSTEM ANALYSIS DESIGN</span><span class="toc-leader"></span><span class="toc-page">22</span>', '<span class="toc-title">3. SYSTEM ANALYSIS DESIGN</span><span class="toc-leader"></span><span class="toc-page">13</span>'],
  ['<span class="toc-title">3.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">22</span>', '<span class="toc-title">3.1 Introduction</span><span class="toc-leader"></span><span class="toc-page">13</span>'],
  ['<span class="toc-title">3.2 Feasibility Study</span><span class="toc-leader"></span><span class="toc-page">22</span>', '<span class="toc-title">3.2 Feasibility Study</span><span class="toc-leader"></span><span class="toc-page">13</span>'],
  ['<span class="toc-title">4. TECHNICAL DESIGN</span><span class="toc-leader"></span><span class="toc-page">24</span>', '<span class="toc-title">4. TECHNICAL DESIGN</span><span class="toc-leader"></span><span class="toc-page">14</span>'],
  ['<span class="toc-title">4.2 Entity Relationship Diagram (ERD)</span><span class="toc-leader"></span><span class="toc-page">24</span>', '<span class="toc-title">4.2 Complete Entity Relationship Diagram (ERD)</span><span class="toc-leader"></span><span class="toc-page">14</span>'],
  ['<span class="toc-title">4.3 Data Flow Diagram (DFD)</span><span class="toc-leader"></span><span class="toc-page">25</span>', '<span class="toc-title">4.3 Complete Data Flow Diagrams (DFD)</span><span class="toc-leader"></span><span class="toc-page">16</span>'],
  ['<span class="toc-title">4.3.1 Context Level DFD (Level 0)</span><span class="toc-leader"></span><span class="toc-page">25</span>', '<span class="toc-title">4.3.1 Context Level DFD (Level 0)</span><span class="toc-leader"></span><span class="toc-page">17</span>'],
  ['<span class="toc-title">4.3.2 Level 1 DFD (Functional Decomposition)</span><span class="toc-leader"></span><span class="toc-page">25</span>', '<span class="toc-title">4.3.2 Level 1 DFD (Complete Decomposition)</span><span class="toc-leader"></span><span class="toc-page">17</span>'],
  ['<span class="toc-title">4.3.3 Level 2 DFD (Verification & Matching Subsystems)</span><span class="toc-leader"></span><span class="toc-page">26</span>', '<span class="toc-title">4.3.3 Level 2 DFDs & Data Dictionary</span><span class="toc-leader"></span><span class="toc-page">18</span>'],
  ['<span class="toc-title">5. SYSTEM DESIGN</span><span class="toc-leader"></span><span class="toc-page">27</span>', '<span class="toc-title">5. SYSTEM DESIGN</span><span class="toc-leader"></span><span class="toc-page">20</span>'],
  ['<span class="toc-title">5.4 Logical Design</span><span class="toc-leader"></span><span class="toc-page">28</span>', '<span class="toc-title">5.4 Logical Design (Complete Relational Schema)</span><span class="toc-leader"></span><span class="toc-page">20</span>'],
  ['<span class="toc-title">5.5 Output Design</span><span class="toc-leader"></span><span class="toc-page">29</span>', '<span class="toc-title">5.5 Output Design</span><span class="toc-leader"></span><span class="toc-page">24</span>'],
  ['<span class="toc-title">5.6 User Interface Design</span><span class="toc-leader"></span><span class="toc-page">30</span>', '<span class="toc-title">5.6 User Interface Design</span><span class="toc-leader"></span><span class="toc-page">25</span>'],
  ['<span class="toc-title">6. TEST DOCUMENTATION</span><span class="toc-leader"></span><span class="toc-page">31</span>', '<span class="toc-title">6. TEST DOCUMENTATION</span><span class="toc-leader"></span><span class="toc-page">26</span>'],
  ['<span class="toc-title">7. LIMITATION OF THE PROJECT</span><span class="toc-leader"></span><span class="toc-page">34</span>', '<span class="toc-title">7. LIMITATION OF THE PROJECT</span><span class="toc-leader"></span><span class="toc-page">28</span>'],
  ['<span class="toc-title">8. CONCLUSION & FUTURE SCOPE</span><span class="toc-leader"></span><span class="toc-page">34</span>', '<span class="toc-title">8. CONCLUSION & FUTURE SCOPE</span><span class="toc-leader"></span><span class="toc-page">28</span>'],
  ['<span class="toc-title">REFERENCES & BIBLIOGRAPHY</span><span class="toc-leader"></span><span class="toc-page">36</span>', '<span class="toc-title">REFERENCES & BIBLIOGRAPHY</span><span class="toc-leader"></span><span class="toc-page">29</span>']
];

for (const [find, replace] of replacements) {
  html = html.replace(find, replace);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Synchronized TOC page numbers in project_report_source.html');

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
