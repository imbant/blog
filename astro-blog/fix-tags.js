#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ASTRO_POSTS_DIR = 'src/content/blog';

function fixTagsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix tags that are strings to arrays
  const fixedContent = content.replace(/^tags: "([^"]*)"$/gm, (match, tagsStr) => {
    return `tags: ["${tagsStr}"]`;
  });
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    return true;
  }
  return false;
}

function main() {
  const files = fs.readdirSync(ASTRO_POSTS_DIR).filter(file => file.endsWith('.md'));
  
  let fixed = 0;
  for (const file of files) {
    const filePath = path.join(ASTRO_POSTS_DIR, file);
    if (fixTagsInFile(filePath)) {
      console.log(`Fixed tags in: ${file}`);
      fixed++;
    }
  }
  
  console.log(`Fixed ${fixed} files`);
}

main();