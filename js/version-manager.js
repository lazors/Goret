/**
 * Version Manager for GORET Pirate Game
 * Helps track and update version numbers across the project
 */

class VersionManager {
    constructor() {
        // Current version configuration
        this.version = {
            major: 0,
            minor: 0,
            patch: 2,
            codename: "Port Interface",
            releaseDate: "August 2025"
        };
        
        // Version history for reference
        this.versionHistory = [
            { version: "0.0.1", codename: "Basic Engine", date: "July 2025" },
            { version: "0.0.2", codename: "Port Interface", date: "August 2025" }
        ];
        
        console.log(`🏴‍☠️ GORET Game v${this.getVersionString()} - ${this.version.codename}`);
    }
    
    /**
     * Get current version as string (e.g., "1.2.0")
     */
    getVersionString() {
        return `${this.version.major}.${this.version.minor}.${this.version.patch}`;
    }
    
    /**
     * Get full version info with codename
     */
    getFullVersionString() {
        return `v${this.getVersionString()} "${this.version.codename}" (${this.version.releaseDate})`;
    }
    
    /**
     * Get current month and year for changelog dates
     */
    getCurrentMonthYear() {
        const date = new Date();
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const year = date.getFullYear();
        return `${month} ${year}`;
    }
    
    /**
     * Increment patch version (for bug fixes)
     */
    incrementPatch() {
        this.version.patch++;
        this.version.releaseDate = this.getCurrentMonthYear();
        console.log(`📦 Version updated to ${this.getVersionString()} (Patch)`);
        return this.getVersionString();
    }
    
    /**
     * Increment minor version (for new features)
     */
    incrementMinor(codename = null) {
        this.version.minor++;
        this.version.patch = 0;
        this.version.releaseDate = this.getCurrentMonthYear();
        if (codename) this.version.codename = codename;
        console.log(`🚀 Version updated to ${this.getVersionString()} (Minor Release)`);
        return this.getVersionString();
    }
    
    /**
     * Increment major version (for major features or breaking changes)
     */
    incrementMajor(codename = null) {
        this.version.major++;
        this.version.minor = 0;
        this.version.patch = 0;
        this.version.releaseDate = this.getCurrentMonthYear();
        if (codename) this.version.codename = codename;
        console.log(`🎉 Version updated to ${this.getVersionString()} (Major Release)`);
        return this.getVersionString();
    }
    
    /**
     * Set a custom version
     */
    setVersion(major, minor, patch, codename = null, releaseDate = null) {
        this.version.major = major;
        this.version.minor = minor;
        this.version.patch = patch;
        if (codename) this.version.codename = codename;
        if (releaseDate) this.version.releaseDate = releaseDate;
        console.log(`✏️ Version manually set to ${this.getVersionString()}`);
        return this.getVersionString();
    }
    
    /**
     * Add version to history
     */
    addToHistory(description = "") {
        this.versionHistory.push({
            version: this.getVersionString(),
            codename: this.version.codename,
            date: this.version.releaseDate,
            description: description
        });
        console.log(`📚 Added ${this.getVersionString()} to version history`);
    }
    
    /**
     * Display version history
     */
    showHistory() {
        console.log("📜 Version History:");
        this.versionHistory.forEach(v => {
            console.log(`  ${v.version} "${v.codename}" (${v.date})`);
            if (v.description) console.log(`    ${v.description}`);
        });
    }
    
    /**
     * Generate changelog template for new version
     */
    generateChangelogTemplate(features = [], fixes = [], technical = []) {
        const version = this.getVersionString();
        const codename = this.version.codename;
        const date = this.version.releaseDate;
        
        let template = `### Version ${version} - "${codename}" (${date})\n`;
        template += `**Status: 🚢 Released**\n\n`;
        
        if (features.length > 0) {
            template += `#### ✨ Major Features Added\n`;
            features.forEach(feature => {
                template += `- ${feature}\n`;
            });
            template += `\n`;
        }
        
        if (fixes.length > 0) {
            template += `#### 🐛 Bug Fixes\n`;
            fixes.forEach(fix => {
                template += `- ${fix}\n`;
            });
            template += `\n`;
        }
        
        if (technical.length > 0) {
            template += `#### 🛠️ Technical Implementation\n`;
            technical.forEach(tech => {
                template += `- ${tech}\n`;
            });
            template += `\n`;
        }
        
        return template;
    }
    
    /**
     * Development helper - show current version info
     */
    displayVersionInfo() {
        console.log(`
🏴‍☠️ GORET Pirate Game - Version Information
═══════════════════════════════════════════
Current Version: ${this.getVersionString()}
Codename: "${this.version.codename}"
Release Date: ${this.version.releaseDate}
Full Version: ${this.getFullVersionString()}
═══════════════════════════════════════════
        `);
    }
    
    /**
     * Export version info for use in other files
     */
    exportVersionData() {
        return {
            version: this.getVersionString(),
            major: this.version.major,
            minor: this.version.minor,
            patch: this.version.patch,
            codename: this.version.codename,
            releaseDate: this.version.releaseDate,
            fullString: this.getFullVersionString()
        };
    }
}

// Create global version manager instance
if (typeof window !== 'undefined') {
    window.GameVersion = new VersionManager();
    console.log('🎮 Game Version Manager loaded');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VersionManager;
}

// Example usage in development:
/*
// To increment versions:
GameVersion.incrementPatch(); // 1.2.0 → 1.2.1
GameVersion.incrementMinor("Trading Update"); // 1.2.1 → 1.3.0
GameVersion.incrementMajor("Full Pirate Adventure"); // 1.3.0 → 2.0.0

// To generate changelog template:
const template = GameVersion.generateChangelogTemplate(
    ["New trading system", "Multiple islands"],
    ["Fixed collision detection", "Improved performance"],
    ["Enhanced asset loading", "Modular architecture"]
);
console.log(template);

// To display version info:
GameVersion.displayVersionInfo();
GameVersion.showHistory();
*/
