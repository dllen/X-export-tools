#!/usr/bin/env node

/**
 * Build script for TweetExport Chrome Extension
 * Packages the extension files for distribution
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const CONFIG = {
  name: 'tweetexport-chrome-extension',
  version: '1.0.0',
  buildDir: 'dist',
  packageName: 'tweetexport-v1.0.0.zip'
};

// Files to include in the package
const FILES_TO_INCLUDE = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.js',
  'popup.css',
  'settings.html',
  'settings.js',
  'settings.css',
  'injected.js',
  'README.md',
  'package.json',
  'icons/'
];

// Create build directory
function createBuildDirectory() {
  if (!fs.existsSync(CONFIG.buildDir)) {
    fs.mkdirSync(CONFIG.buildDir, { recursive: true });
    console.log(`✅ Created build directory: ${CONFIG.buildDir}`);
  }
}

// Validate required files
function validateFiles() {
  const missingFiles = [];
  
  FILES_TO_INCLUDE.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  console.log('✅ All required files found');
}

// Create the ZIP package
function createPackage() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(CONFIG.buildDir, CONFIG.packageName));
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Package created: ${CONFIG.packageName} (${sizeInMB} MB)`);
      console.log(`📦 Total files: ${archive.pointer()} bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      console.error('❌ Error creating package:', err);
      reject(err);
    });
    
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️  Warning:', err);
      } else {
        console.error('❌ Error:', err);
        reject(err);
      }
    });
    
    archive.pipe(output);
    
    // Add files to archive
    FILES_TO_INCLUDE.forEach(file => {
      const filePath = path.join(__dirname, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Add directory contents
        archive.directory(filePath, file);
      } else {
        // Add individual file
        archive.file(filePath, { name: file });
      }
    });
    
    archive.finalize();
  });
}

// Generate manifest for distribution
function generateDistManifest() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const distManifestPath = path.join(CONFIG.buildDir, 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Remove development-only permissions
    if (manifest.permissions) {
      manifest.permissions = manifest.permissions.filter(permission => 
        !permission.includes('localhost') && !permission.includes('127.0.0.1')
      );
    }
    
    // Update for production
    manifest.version = CONFIG.version;
    
    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Generated distribution manifest');
  }
}

// Create installation instructions
function createInstallationInstructions() {
  const instructions = `# Installation Instructions for TweetExport

## Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "TweetExport"
3. Click "Add to Chrome"
4. Grant necessary permissions

## Manual Installation
1. Extract the ${CONFIG.packageName} file
2. Open Chrome and navigate to \`chrome://extensions/\`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extracted folder
6. The extension icon will appear in your toolbar

## Files Included
${FILES_TO_INCLUDE.map(file => `- ${file}`).join('\n')}

## Version
${CONFIG.version}

## Support
For support and updates, visit: https://github.com/your-username/tweetexport-chrome-extension
`;
  
  fs.writeFileSync(path.join(CONFIG.buildDir, 'INSTALL.md'), instructions);
  console.log('✅ Created installation instructions');
}

// Main build function
async function build() {
  console.log('🚀 Starting TweetExport build process...');
  console.log('');
  
  try {
    // Step 1: Create build directory
    createBuildDirectory();
    
    // Step 2: Validate files
    validateFiles();
    
    // Step 3: Generate distribution files
    generateDistManifest();
    
    // Step 4: Create package
    await createPackage();
    
    // Step 5: Create installation instructions
    createInstallationInstructions();
    
    console.log('');
    console.log('🎉 Build completed successfully!');
    console.log('');
    console.log('📁 Output files:');
    console.log(`   - ${path.join(CONFIG.buildDir, CONFIG.packageName)}`);
    console.log(`   - ${path.join(CONFIG.buildDir, 'INSTALL.md')}`);
    console.log('');
    console.log('🚀 Ready for distribution!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build, CONFIG };