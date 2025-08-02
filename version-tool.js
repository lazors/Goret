#!/usr/bin/env node

/**
 * GORET Game Version Update Tool
 * Run this script to update version numbers and generate changelog templates
 * 
 * Usage:
 *   node version-tool.js patch           # Increment patch (1.2.0 -> 1.2.1)
 *   node version-tool.js minor "Name"    # Increment minor (1.2.0 -> 1.3.0)
 *   node version-tool.js major "Name"    # Increment major (1.2.0 -> 2.0.0)
 *   node version-tool.js info            # Show current version info
 *   node version-tool.js template        # Generate changelog template
 */

const fs = require('fs');
const path = require('path');

// Load version manager
const VersionManager = require('./js/version-manager.js');
const versionManager = new VersionManager();

// Command line arguments
const command = process.argv[2];
const codename = process.argv[3];

// Helper functions
function updateVersionInFiles(newVersion) {
    // Update version manager file
    const vmPath = path.join(__dirname, 'js', 'version-manager.js');
    let vmContent = fs.readFileSync(vmPath, 'utf8');
    
    // Update version numbers in version manager
    vmContent = vmContent.replace(
        /major:\s*\d+,/,
        `major: ${versionManager.version.major},`
    );
    vmContent = vmContent.replace(
        /minor:\s*\d+,/,
        `minor: ${versionManager.version.minor},`
    );
    vmContent = vmContent.replace(
        /patch:\s*\d+,/,
        `patch: ${versionManager.version.patch},`
    );
    
    if (codename) {
        vmContent = vmContent.replace(
            /codename:\s*"[^"]*",/,
            `codename: "${codename}",`
        );
    }
    
    // Update release date
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    vmContent = vmContent.replace(
        /releaseDate:\s*"[^"]*"/,
        `releaseDate: "${today}"`
    );
    
    fs.writeFileSync(vmPath, vmContent);
    
    // Update CHANGELOG.md
    const changelogPath = path.join(__dirname, 'CHANGELOG.md');
    let changelogContent = fs.readFileSync(changelogPath, 'utf8');
    
    // Update current version at top
    changelogContent = changelogContent.replace(
        /\*\*Current Version:\s*[\d.]+\*\*/,
        `**Current Version: ${newVersion}**`
    );
    
    // Update last updated date
    changelogContent = changelogContent.replace(
        /\*\*Last Updated:\s*[^*]+\*\*/,
        `**Last Updated: ${today}**`
    );
    
    fs.writeFileSync(changelogPath, changelogContent);
    
    console.log(`✅ Updated version to ${newVersion} in all files`);
}

function generateChangelogSection() {
    const template = versionManager.generateChangelogTemplate(
        [
            "New feature description here",
            "Another feature description"
        ],
        [
            "Bug fix description here",
            "Another bug fix description"
        ],
        [
            "Technical improvement description",
            "Another technical change"
        ]
    );
    
    console.log("\n📝 Changelog Template:");
    console.log("=" .repeat(50));
    console.log(template);
    console.log("Copy this template to CHANGELOG.md and customize it!");
}

// Main command handler
switch (command) {
    case 'patch':
        const patchVersion = versionManager.incrementPatch();
        updateVersionInFiles(patchVersion);
        break;
        
    case 'minor':
        const minorVersion = versionManager.incrementMinor(codename);
        updateVersionInFiles(minorVersion);
        if (codename) {
            console.log(`📦 Set codename to: "${codename}"`);
        }
        break;
        
    case 'major':
        const majorVersion = versionManager.incrementMajor(codename);
        updateVersionInFiles(majorVersion);
        if (codename) {
            console.log(`🎉 Set codename to: "${codename}"`);
        }
        break;
        
    case 'info':
        versionManager.displayVersionInfo();
        versionManager.showHistory();
        break;
        
    case 'template':
        generateChangelogSection();
        break;
        
    case 'help':
    case '--help':
    case '-h':
        console.log(`
🏴‍☠️ GORET Version Update Tool

Commands:
  patch              Increment patch version (bug fixes)
  minor "Name"       Increment minor version (new features)
  major "Name"       Increment major version (major changes)
  info               Show current version information
  template           Generate changelog template
  help               Show this help message

Examples:
  node version-tool.js patch
  node version-tool.js minor "Trading Update"
  node version-tool.js major "Full Pirate Adventure"
  node version-tool.js info
  node version-tool.js template
        `);
        break;
        
    default:
        console.log('❌ Unknown command. Use "help" to see available commands.');
        break;
}

console.log(`\n🏴‍☠️ Current version: ${versionManager.getFullVersionString()}`);
