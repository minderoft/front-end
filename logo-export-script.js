/**
 * LocaPlus Logo Export Script
 * 
 * This script helps convert the SVG logo to various PNG sizes needed for
 * App Store, Play Store, and web usage.
 * 
 * Requirements: sharp (npm install sharp)
 * Usage: node logo-export-script.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Please run: npm install sharp');
  console.log('Or use the manual conversion instructions below.');
  process.exit(0);
}

// SVG content - same as in the specification
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Subtle shadow filter for depth -->
    <filter id="microShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
    
    <!-- Slightly stronger shadow for layering -->
    <filter id="layerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  
  <!-- Background - Pure white -->
  <rect width="512" height="512" fill="#FFFFFF"/>
  
  <!-- Main emblem group - centered -->
  <g transform="translate(256, 256)" filter="url(#microShadow)">
    
    <!-- Outer ring - Royal Blue matte -->
    <circle cx="0" cy="0" r="180" fill="none" stroke="#1E3A8A" stroke-width="8" opacity="0.15"/>
    
    <!-- Location pin base shape - stylized teardrop -->
    <path d="M 0,-140 
             C 77.3,-140 140,-77.3 140,0 
             C 140,58 105.6,107.7 68,125.5 
             L 0,160 
             L -68,125.5 
             C -105.6,107.7 -140,58 -140,0 
             C -140,-77.3 -77.3,-140 0,-140 Z" 
          fill="#1E3A8A" opacity="0.9"/>
    
    <!-- Inner housing/connectivity structure - abstract geometric home -->
    <g filter="url(#layerShadow)">
      <!-- Roof line - stylized house top -->
      <path d="M -80,-30 L 0,-90 L 80,-30" 
            fill="none" stroke="#06B6D4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Base structure - interconnected lines -->
      <rect x="-65" y="-25" width="130" height="80" rx="6" 
            fill="none" stroke="#06B6D4" stroke-width="10"/>
      
      <!-- Central connectivity node -->
      <circle cx="0" cy="15" r="18" fill="#06B6D4"/>
      
      <!-- Horizontal connection lines -->
      <line x1="-50" y1="15" x2="-22" y2="15" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
      <line x1="22" y1="15" x2="50" y2="15" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
      
      <!-- Vertical connection -->
      <line x1="0" y1="-50" x2="0" y2="-3" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
    </g>
    
    <!-- Premium gold accent - validation checkmark -->
    <g transform="translate(0, 80)" filter="url(#microShadow)">
      <!-- Small gold circle backdrop -->
      <circle cx="0" cy="0" r="22" fill="#F59E0B" opacity="0.9"/>
      
      <!-- Checkmark symbol - premium validation -->
      <path d="M -10,0 L -3,8 L 12,-7" 
            fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    
    <!-- Pin center dot - focal point -->
    <circle cx="0" cy="-140" r="12" fill="#06B6D4"/>
    
  </g>
  
  <!-- Safety margin indicator (for reference, very subtle) -->
  <rect x="16" y="16" width="480" height="480" rx="4" 
        fill="none" stroke="#E5E7EB" stroke-width="1" opacity="0.3"/>
</svg>`;

// Export sizes needed for different platforms
const exportConfigs = [
  // App Store
  { size: 1024, name: 'app-icon-1024.png', purpose: 'iOS App Store' },
  { size: 180, name: 'app-icon-180.png', purpose: 'iOS App Icon (iPhone)' },
  { size: 120, name: 'app-icon-120.png', purpose: 'iOS App Icon (iPhone)' },
  { size: 167, name: 'app-icon-167.png', purpose: 'iOS App Icon (iPad Pro)' },
  { size: 152, name: 'app-icon-152.png', purpose: 'iOS App Icon (iPad)' },
  { size: 76, name: 'app-icon-76.png', purpose: 'iOS App Icon (iPad)' },
  
  // Play Store
  { size: 512, name: 'app-icon-512.png', purpose: 'Android Play Store' },
  { size: 192, name: 'app-icon-192.png', purpose: 'Android Launcher (xxxhdpi)' },
  { size: 144, name: 'app-icon-144.png', purpose: 'Android Launcher (xxhdpi)' },
  { size: 96, name: 'app-icon-96.png', purpose: 'Android Launcher (xhdpi)' },
  { size: 72, name: 'app-icon-72.png', purpose: 'Android Launcher (hdpi)' },
  { size: 48, name: 'app-icon-48.png', purpose: 'Android Launcher (mdpi)' },
  
  // Web
  { size: 32, name: 'favicon-32.png', purpose: 'Web Favicon' },
  { size: 16, name: 'favicon-16.png', purpose: 'Web Favicon' },
  { size: 192, name: 'pwa-icon-192.png', purpose: 'PWA Manifest' },
  { size: 512, name: 'pwa-icon-512.png', purpose: 'PWA Manifest' },
  
  // Social Media
  { size: 400, name: 'social-icon-400.png', purpose: 'Social Media' },
  { size: 200, name: 'social-icon-200.png', purpose: 'Social Media' },
];

async function exportLogos() {
  const outputDir = path.join(__dirname, 'front-end', 'public', 'icons');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('🎨 LocaPlus Logo Export Tool');
  console.log('============================\n');
  
  for (const config of exportConfigs) {
    const outputPath = path.join(outputDir, config.name);
    
    try {
      await sharp(Buffer.from(svgContent))
        .resize(config.size, config.size)
        .png()
        .toFile(outputPath);
      
      const successMsg = '✅ ' + config.name + ' (' + config.size + 'x' + config.size + ') - ' + config.purpose;
      console.log(successMsg);
    } catch (error) {
      const errorMsg = '❌ Error exporting ' + config.name + ': ' + error.message;
      console.log(errorMsg);
    }
  }
  
  console.log('\n🎉 All logos exported successfully to:', outputDir);
  console.log('\n📱 Next Steps:');
  console.log('   - For iOS: Use App Icon sizes in Xcode Asset Catalog');
  console.log('   - For Android: Use launcher icons in res/mipmap folders');
  console.log('   - For Web: Update favicon links in index.html');
}

// Run the export
exportLogos().catch(console.error);
