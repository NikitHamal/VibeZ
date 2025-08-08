#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

function resolveBundle() {
  const p = path.join(__dirname, 'gemini.js');
  if (fs.existsSync(p)) return p;
  // fallback in case different asset path
  return path.join(__dirname, '..', 'gemini.js');
}

function main() {
  const argv = process.argv.slice(2);
  const bundle = resolveBundle();
  if (!fs.existsSync(bundle)) {
    console.error('gemini.js bundle not found in assets');
    process.exit(1);
  }
  // Emulate CLI bin behavior
  process.argv = ['node', 'qwen', ...argv];
  require(bundle);
}

main();