const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="microShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
    <filter id="layerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="#FFFFFF"/>
  <g transform="translate(256, 256)" filter="url(#microShadow)">
    <circle cx="0" cy="0" r="180" fill="none" stroke="#1E3A8A" stroke-width="8" opacity="0.15"/>
    <path d="M 0,-140 C 77.3,-140 140,-77.3 140,0 C 140,58 105.6,107.7 68,125.5 L 0,160 L -68,125.5 C -105.6,107.7 -140,58 -140,0 C -140,-77.3 -77.3,-140 0,-140 Z" fill="#1E3A8A" opacity="0.9"/>
    <g filter="url(#layerShadow)">
      <path d="M -80,-30 L 0,-90 L 80,-30" fill="none" stroke="#06B6D4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="-65" y="-25" width="130" height="80" rx="6" fill="none" stroke="#06B6D4" stroke-width="10"/>
      <circle cx="0" cy="15" r="18" fill="#06B6D4"/>
      <line x1="-50" y1="15" x2="-22" y2="15" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
      <line x1="22" y1="15" x2="50" y2="15" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
      <line x1="0" y1="-50" x2="0" y2="-3" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
    </g>
    <g transform="translate(0, 80)" filter="url(#microShadow)">
      <circle cx="0" cy="0" r="22" fill="#F59E0B" opacity="0.9"/>
      <path d="M -10,0 L -3,8 L 12,-7" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <circle cx="0" cy="-140" r="12" fill="#06B6D4"/>
  </g>
  <rect x="16" y="16" width="480" height="480" rx="4" fill="none" stroke="#E5E7EB" stroke-width="1" opacity="0.3"/>
</svg>`;

const outputPath = path.join(__dirname, 'front-end', 'src', 'assets', 'logo.svg');

fs.writeFileSync(outputPath, svgContent, 'utf8');
console.log('✅ LocaPlus logo created successfully at:', outputPath);