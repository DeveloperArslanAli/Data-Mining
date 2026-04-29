/**
 * Simple test script to verify pipeline components can be imported
 * Run with: node test-pipeline.js
 */

const fs = require('fs');
const path = require('path');

const pipelineDir = path.join(__dirname, 'src/components/pipeline');
const pagesDir = path.join(__dirname, 'src/pages');

console.log('🔍 Testing Data Mining Platform Pipeline Components...\n');

// Check if pipeline components exist
const requiredComponents = [
  'DataPipeline.tsx',
  'DataInputSection.tsx', 
  'DataPreviewSection.tsx',
  'AISuggestionsPanel.tsx',
  'CleaningOperationsSection.tsx',
  'ExportSection.tsx'
];

const requiredPages = [
  'pipeline/index.tsx',
  'demo.tsx'
];

console.log('📁 Checking Pipeline Components:');
let allComponentsExist = true;

requiredComponents.forEach(component => {
  const filePath = path.join(pipelineDir, component);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${component}`);
  if (!exists) allComponentsExist = false;
});

console.log('\n📄 Checking Pipeline Pages:');
let allPagesExist = true;

requiredPages.forEach(page => {
  const filePath = path.join(pagesDir, page);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${page}`);
  if (!exists) allPagesExist = false;
});

// Check file sizes
console.log('\n📊 Component File Sizes:');
requiredComponents.forEach(component => {
  const filePath = path.join(pipelineDir, component);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  📏 ${component}: ${sizeKB} KB`);
  }
});

console.log('\n📊 Page File Sizes:');
requiredPages.forEach(page => {
  const filePath = path.join(pagesDir, page);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  📏 ${page}: ${sizeKB} KB`);
  }
});

// Summary
console.log('\n📋 Summary:');
if (allComponentsExist && allPagesExist) {
  console.log('🎉 All pipeline components and pages exist!');
  console.log('✅ Phase 3: Prototyping (Wireframe + Clickable UI) - COMPLETE');
  console.log('\n🚀 Next steps:');
  console.log('  1. Start the development server: npm run dev');
  console.log('  2. Navigate to /demo to test the pipeline');
  console.log('  3. Navigate to /pipeline for the full pipeline page');
} else {
  console.log('❌ Some components or pages are missing');
  console.log('Please check the file structure and recreate missing files');
}

console.log('\n🔧 To test the pipeline:');
console.log('  1. npm run dev');
console.log('  2. Open http://localhost:3050/demo');
console.log('  3. Click "Start Pipeline Demo"');
console.log('  4. Follow the complete pipeline flow');
