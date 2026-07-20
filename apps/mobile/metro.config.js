const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Root of the monorepo
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// Tell Metro to watch the entire monorepo for changes
config.watchFolders = [monorepoRoot];

// Tell Metro to resolve modules from both the app and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
