#!/usr/bin/env node
/**
 * Integrity check for the question bank.
 *
 * The bank is meant to grow to thousands of entries (PRD §13), much of it
 * generated in bulk, so a bad id or a missing answer is easy to introduce and
 * hard to spot at runtime — a malformed question would simply show up blank
 * mid-game. Run with: npm run validate:content
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedDir = join(root, 'content', 'seed');
const VALID_DIFFICULTY = new Set(['easy', 'medium', 'hard']);
const REQUIRED_FIELDS = ['id', 'category', 'subcategory', 'question', 'answer', 'difficulty'];

const errors = [];
const seenIds = new Map();
const perCategory = {};
let total = 0;

const files = readdirSync(seedDir).filter((f) => f.endsWith('.json')).sort();

for (const file of files) {
  const categoryId = file.replace(/\.json$/, '');
  const path = join(seedDir, file);

  let questions;
  try {
    questions = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    errors.push(`${file}: not valid JSON — ${err.message}`);
    continue;
  }

  if (!Array.isArray(questions)) {
    errors.push(`${file}: expected a top-level array`);
    continue;
  }

  perCategory[categoryId] = questions.length;
  total += questions.length;

  questions.forEach((q, index) => {
    const where = `${file}[${index}]`;

    for (const field of REQUIRED_FIELDS) {
      if (typeof q[field] !== 'string' || q[field].trim() === '') {
        errors.push(`${where}: "${field}" is missing or empty`);
      }
    }

    if (q.difficulty && !VALID_DIFFICULTY.has(q.difficulty)) {
      errors.push(`${where}: difficulty "${q.difficulty}" is not easy|medium|hard`);
    }

    // The loader keys decks by category id, so a mismatch silently strands
    // the question in a deck nobody draws from.
    if (q.category && q.category !== categoryId) {
      errors.push(`${where}: category "${q.category}" does not match file "${categoryId}"`);
    }

    if (q.id) {
      const previous = seenIds.get(q.id);
      if (previous) errors.push(`${where}: duplicate id "${q.id}" (also in ${previous})`);
      else seenIds.set(q.id, where);
    }
  });
}

console.log(`\n  categories: ${files.length}`);
for (const [categoryId, count] of Object.entries(perCategory)) {
  console.log(`    ${categoryId.padEnd(12)} ${count}`);
}
console.log(`  total questions: ${total}\n`);

if (errors.length) {
  console.error(`  ${errors.length} problem(s):\n`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('  content OK\n');
