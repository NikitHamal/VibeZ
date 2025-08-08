#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Patch console to prefix messages for native listener parsing (optional)
const origLog = console.log.bind(console);
const origError = console.error.bind(console);
console.log = (...args) => { origLog('[STDOUT]', ...args); };
console.error = (...args) => { origError('[STDERR]', ...args); };

function resolveBundle() {
  const p = path.join(__dirname, 'gemini.js');
  if (fs.existsSync(p)) return p;
  return path.join(__dirname, '..', 'gemini.js');
}

function main() {
  const argv = process.argv.slice(2);
  const bundle = resolveBundle();
  if (!fs.existsSync(bundle)) {
    console.error('gemini.js bundle not found in assets');
    process.exit(1);
  }
  process.argv = ['node', 'qwen', ...argv];
  try {
    require(bundle);
  } catch (e) {
    console.error('Fatal error in CLI:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

main();