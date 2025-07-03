#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const HEXO_POSTS_DIR = '../source/_posts';
const ASTRO_POSTS_DIR = 'src/content/blog';

// Function to convert date format from "YYYY-M-D" to "YYYY-MM-DD"
function normalizeDate(dateStr) {
  // Handle different date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date: ${dateStr}, using current date`);
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

// Function to create a URL-friendly slug from filename
function createSlug(filename) {
  return filename
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Function to parse front matter and content
function parseFrontMatter(content) {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontMatterMatch) {
    return { frontMatter: {}, content };
  }
  
  const frontMatterStr = frontMatterMatch[1];
  const bodyContent = frontMatterMatch[2];
  
  const frontMatter = {};
  
  // Parse YAML-like front matter
  const lines = frontMatterStr.split('\n');
  let currentKey = null;
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
      const [key, ...valueParts] = line.split(':');
      currentKey = key.trim();
      const value = valueParts.join(':').trim();
      
      if (value.startsWith('[') && value.endsWith(']')) {
        // Parse array
        frontMatter[currentKey] = value
          .slice(1, -1)
          .split(',')
          .map(item => item.trim().replace(/^['"]|['"]$/g, ''));
      } else if (value === 'true' || value === 'false') {
        frontMatter[currentKey] = value === 'true';
      } else if (value) {
        frontMatter[currentKey] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }
  
  return { frontMatter, content: bodyContent };
}

// Function to convert a single post
function convertPost(filename) {
  const hexoPath = path.join(HEXO_POSTS_DIR, filename);
  const content = fs.readFileSync(hexoPath, 'utf-8');
  
  const { frontMatter, content: bodyContent } = parseFrontMatter(content);
  
  // Create slug from filename
  const slug = createSlug(filename);
  const astroPath = path.join(ASTRO_POSTS_DIR, `${slug}.md`);
  
  // Convert front matter
  const astroFrontMatter = {
    title: frontMatter.title || 'Untitled',
    date: frontMatter.date ? normalizeDate(frontMatter.date) : new Date().toISOString().split('T')[0],
  };
  
  if (frontMatter.tags && frontMatter.tags.length > 0) {
    astroFrontMatter.tags = frontMatter.tags;
  }
  
  if (frontMatter.categories && frontMatter.categories.length > 0) {
    astroFrontMatter.categories = frontMatter.categories;
  }
  
  if (frontMatter.description) {
    astroFrontMatter.description = frontMatter.description;
  }
  
  if (frontMatter.toc !== undefined) {
    astroFrontMatter.toc = frontMatter.toc;
  }
  
  if (frontMatter.mathjax !== undefined) {
    astroFrontMatter.mathjax = frontMatter.mathjax;
  }
  
  if (frontMatter.comments !== undefined) {
    astroFrontMatter.comments = frontMatter.comments;
  }
  
  // Generate description from content if not provided
  if (!astroFrontMatter.description && bodyContent) {
    const firstParagraph = bodyContent
      .split('\n')
      .find(line => line.trim() && !line.startsWith('#') && !line.startsWith('!['))
      ?.trim()
      ?.substring(0, 150);
    
    if (firstParagraph) {
      astroFrontMatter.description = firstParagraph + (firstParagraph.length === 150 ? '...' : '');
    }
  }
  
  // Build new content
  const astroContent = [
    '---',
    ...Object.entries(astroFrontMatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      } else if (typeof value === 'boolean') {
        return `${key}: ${value}`;
      } else {
        return `${key}: "${value}"`;
      }
    }),
    '---',
    '',
    bodyContent
  ].join('\n');
  
  fs.writeFileSync(astroPath, astroContent);
  
  return {
    original: filename,
    slug,
    title: astroFrontMatter.title,
    date: astroFrontMatter.date
  };
}

// Main function
function main() {
  if (!fs.existsSync(HEXO_POSTS_DIR)) {
    console.error(`Hexo posts directory not found: ${HEXO_POSTS_DIR}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(ASTRO_POSTS_DIR)) {
    fs.mkdirSync(ASTRO_POSTS_DIR, { recursive: true });
  }
  
  // Get all markdown files
  const files = fs.readdirSync(HEXO_POSTS_DIR).filter(file => file.endsWith('.md'));
  
  console.log(`Found ${files.length} markdown files to migrate`);
  
  const results = [];
  const errors = [];
  
  for (const file of files) {
    try {
      const result = convertPost(file);
      results.push(result);
      console.log(`✓ Migrated: ${file} -> ${result.slug}.md`);
    } catch (error) {
      errors.push({ file, error: error.message });
      console.error(`✗ Failed to migrate ${file}:`, error.message);
    }
  }
  
  console.log(`\nMigration complete:`);
  console.log(`- Successfully migrated: ${results.length} files`);
  console.log(`- Errors: ${errors.length} files`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }
}

main();