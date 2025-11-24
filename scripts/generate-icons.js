const fs = require('fs');
const path = require('path');

// Create a simple SVG icon as a fallback
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
  <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" fill="#3b82f6" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold">DFC</text>
</svg>`;
};

// Create icon files
const publicDir = path.join(__dirname, '../public');

// Create 192x192 icon
fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), createSVGIcon(192));

// Create 512x512 icon  
fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), createSVGIcon(512));

console.log('PWA icons created successfully!');
