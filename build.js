#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, 'out');
const FILES_TO_COPY = ['manifest.json', 'styles.css', 'popup.html', 'popup.js', 'stack-overflow-wordmark.svg'];
const DIRS_TO_COPY = ['icons'];

// Auto-scan for all .js files in root directory (excluding build.js and .backup files)
function getJsFiles() {
    const jsFiles = fs.readdirSync(SOURCE_DIR)
        .filter(file => file.endsWith('.js') && file !== 'build.js' && !file.endsWith('.backup'));
    return jsFiles;
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

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

function copyDir(dirName) {
    const sourcePath = path.join(SOURCE_DIR, dirName);
    const destPath = path.join(OUTPUT_DIR, dirName);

    if (!fs.existsSync(sourcePath)) {
        console.warn(`Warning: Source directory not found: ${dirName}`);
        return false;
    }

    try {
        ensureDir(destPath);
        const files = fs.readdirSync(sourcePath);
        let copiedCount = 0;

        files.forEach(file => {
            const sourceFile = path.join(sourcePath, file);
            const destFile = path.join(destPath, file);

            if (fs.statSync(sourceFile).isDirectory()) {
                copyDir(path.join(dirName, file));
            } else {
                fs.copyFileSync(sourceFile, destFile);
                copiedCount++;
            }
        });

        console.log(`Copied directory: ${dirName} (${copiedCount} files)`);
        return true;
    } catch (err) {
        console.error(`Error copying directory ${dirName}:`, err.message);
        return false;
    }
}

function build() {
    console.log('Building Silent Reddit extension...\n');
    ensureDir(OUTPUT_DIR);

    let successCount = 0;
    let failCount = 0;

    const jsFiles = getJsFiles();
    const allItems = [...FILES_TO_COPY, ...jsFiles, ...DIRS_TO_COPY];

    allItems.forEach(item => {
        const fn = DIRS_TO_COPY.includes(item) ? copyDir : copyFile;
        fn(item) ? successCount++ : failCount++;
    });

    console.log(`\nBuild complete: ${successCount} items copied`);
    if (failCount > 0) console.warn(`${failCount} items failed`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
}

function watch() {
    console.log('Starting watch mode...\n');
    build();
    console.log('\nWatching for file changes...\nPress Ctrl+C to stop\n');

    const jsFiles = getJsFiles();
    const filesToWatch = [...FILES_TO_COPY, ...jsFiles];

    filesToWatch.forEach(fileName => {
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

    DIRS_TO_COPY.forEach(dirName => {
        const dirPath = path.join(SOURCE_DIR, dirName);
        if (fs.existsSync(dirPath)) {
            fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                if (eventType === 'change' || eventType === 'rename') {
                    console.log(`\nDirectory changed: ${dirName}/${filename || ''}`);
                    copyDir(dirName);
                }
            });
        }
    });
}

const args = process.argv.slice(2);
args.includes('--watch') || args.includes('-w') ? watch() : build();
