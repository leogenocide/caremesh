export const styles = `
  @page {
    size: A4 portrait;
    margin: 18mm 14mm 18mm 14mm;
    @top-right {
      content: "A Social Coordination Network";
      font-size: 8.5pt;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #64748b;
    }
    @bottom-left {
      content: "[Institution / College Name]";
      font-size: 8.5pt;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #64748b;
    }
    @bottom-right {
      content: counter(page);
      font-size: 8.5pt;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-weight: 600;
      color: #1e293b;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    font-family: 'Cambria', 'Georgia', 'Times New Roman', serif;
    font-size: 10.8pt;
    line-height: 1.62;
    color: #1e293b;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  /* Page Break Utilities */
  .page-break {
    page-break-before: always;
    break-before: page;
  }
  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid;
    break-after: avoid;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
  }

  .chapter-title {
    font-size: 20pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2.5px solid #2563eb;
    padding-bottom: 8px;
    margin-top: 0;
    margin-bottom: 22px;
    color: #1e3a8a;
  }

  h1 { font-size: 15.5pt; margin-top: 1.5em; }
  h2 { font-size: 13pt; color: #1e40af; }
  h3 { font-size: 11.2pt; color: #334155; }
  h4 { font-size: 10.2pt; color: #475569; }

  p {
    margin-top: 0;
    margin-bottom: 0.9em;
    text-align: justify;
    hyphens: auto;
  }

  /* Cover Page */
  .cover-page {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    padding: 12mm 8mm 8mm 8mm;
    page-break-after: always;
    border: 2px double #cbd5e1;
  }
  .cover-header {
    margin-top: 4mm;
  }
  .cover-inst-title {
    font-size: 17pt;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .cover-inst-sub {
    font-size: 11pt;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #475569;
    margin-top: 3px;
  }
  .cover-project-badge {
    margin: 10mm 0 8mm 0;
  }
  .cover-report-tag {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #64748b;
    font-weight: 600;
  }
  .cover-project-title {
    font-size: 24pt;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 800;
    color: #1d4ed8;
    margin: 10px 0 8px 0;
    line-height: 1.2;
    text-transform: uppercase;
  }
  .cover-project-sub {
    font-size: 11.5pt;
    color: #334155;
    font-style: italic;
    max-width: 85%;
    margin: 0 auto;
  }
  .cover-meta-grid {
    display: flex;
    justify-content: space-between;
    text-align: left;
    margin: 10mm 4mm 8mm 4mm;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
  }
  .meta-col {
    width: 48%;
  }
  .meta-label {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 5px;
    text-transform: uppercase;
    font-size: 9.5pt;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 2px;
  }
  .meta-line {
    margin: 3px 0;
    color: #334155;
  }
  .cover-footer {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9.5pt;
    color: #475569;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    margin-bottom: 2mm;
  }

  /* Blanks & Placeholders */
  .fill-blank {
    display: inline-block;
    border-bottom: 1.5px dotted #64748b;
    min-width: 130px;
    padding: 0 4px;
    color: #1e40af;
    font-weight: 600;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  /* Tables - STRICT OVERFLOW MITIGATION */
  table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 8.8pt;
    font-family: 'Segoe UI', Arial, sans-serif;
    page-break-inside: auto;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
    hyphens: auto;
  }
  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 8.8pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Callout & Note Cards */
  .callout-box {
    background: #f8fafc;
    border-left: 4px solid #3b82f6;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
    page-break-inside: avoid;
  }
  .callout-box.security {
    border-left-color: #10b981;
    background: #f0fdf4;
  }
  .callout-box.governance {
    border-left-color: #8b5cf6;
    background: #faf5ff;
  }
  .callout-title {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 700;
    color: #0f172a;
    font-size: 10pt;
    margin-bottom: 4px;
  }

  /* Table of Contents */
  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9pt;
  }
  .toc-item {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .toc-level-1 {
    font-weight: 700;
    color: #0f172a;
    margin-top: 8px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 2px;
  }
  .toc-level-2 {
    padding-left: 18px;
    color: #334155;
    font-weight: 500;
  }
  .toc-level-3 {
    padding-left: 36px;
    color: #64748b;
    font-size: 8.5pt;
  }
  .toc-title {
    background: #fff;
    padding-right: 6px;
    position: relative;
    z-index: 1;
  }
  .toc-leader {
    flex-grow: 1;
    border-bottom: 1px dotted #94a3b8;
    margin: 0 4px;
    transform: translateY(-4px);
  }
  .toc-page {
    background: #fff;
    padding-left: 6px;
    font-weight: 600;
    color: #1e293b;
    position: relative;
    z-index: 1;
  }

  /* Diagrams */
  .diagram-container {
    text-align: center;
    margin: 16px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .diagram-container svg {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    background: #ffffff;
    border: 1px solid #e2e8f0;
  }
  .diagram-caption {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9pt;
    font-weight: 600;
    color: #475569;
    margin-top: 6px;
    font-style: italic;
  }

  /* Code / Schema Listings */
  pre, code {
    font-family: 'Consolas', 'Courier New', monospace;
    word-break: break-all !important;
  }
  pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #0284c7;
    padding: 8px 12px;
    font-size: 8pt;
    line-height: 1.4;
    border-radius: 4px;
    overflow-x: hidden;
    white-space: pre-wrap !important;
    page-break-inside: avoid;
  }

  /* UI Mockup Cards */
  .ui-mockup-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    margin: 14px 0;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    page-break-inside: avoid;
  }
  .ui-mockup-header {
    background: #f1f5f9;
    padding: 6px 12px;
    border-bottom: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9pt;
    font-weight: 700;
    color: #1e293b;
  }
  .ui-mockup-body {
    padding: 12px;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 8.8pt;
    color: #334155;
  }
`;
