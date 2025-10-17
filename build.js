#!/usr/bin/env node

/**
 * Build script for Silent Reddit Chrome Extension
 * Copies extension files to the out/ directory for Chrome to load
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, 'out');

// Files to copy to the output directory
const FILES_TO_COPY = [
    'manifest.json',
    'content.js',
    'styles.css'
];

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

/**
 * Copy a single file
 */
function copyFile(fileName) {
    const sourcePath = path.join(SOURCE_DIR, fileName);
    const destPath = path.join(OUTPUT_DIR, fileName);
    
    if (!fs.existsSync(sourcePath)) {
        console.warn(`Warning: Source file not found: ${fileName}`);
        return false;
    }
    
    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${fileName}`);
        return true;
    } catch (err) {
        console.error(`Error copying ${fileName}:`, err.message);
        return false;
    }
}

/**
 * Build the extension
 */
function build() {
    console.log('Building Silent Reddit extension...\n');
    
    // Ensure output directory exists
    ensureDir(OUTPUT_DIR);
    
    // Copy all files
    let successCount = 0;
    let failCount = 0;
    
    FILES_TO_COPY.forEach(fileName => {
        if (copyFile(fileName)) {
            successCount++;
        } else {
            failCount++;
        }
    });
    
    // Summary
    console.log(`\nBuild complete: ${successCount} files copied`);
    if (failCount > 0) {
        console.warn(`${failCount} files failed to copy`);
    }
    console.log(`Output directory: ${OUTPUT_DIR}`);
}

/**
 * Watch mode - rebuild on file changes
 */
function watch() {
    console.log('Starting watch mode...\n');
    
    // Initial build
    build();
    
    console.log('\nWatching for file changes...');
    console.log('Press Ctrl+C to stop\n');
    
    // Watch each source file
    FILES_TO_COPY.forEach(fileName => {
        const filePath = path.join(SOURCE_DIR, fileName);
        
        if (fs.existsSync(filePath)) {
            fs.watch(filePath, (eventType) => {
                if (eventType === 'change') {
                    console.log(`\nFile changed: ${fileName}`);
                    copyFile(fileName);
                }
            });
        }
    });
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--watch') || args.includes('-w')) {
    watch();
} else {
    build();
}
