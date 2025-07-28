const fs = require('fs');
const path = require('path');

// Function to fix common JSX issues
function fixJSXIssues(content) {
  // Fix React fragment issues
  content = content.replace(/^\s*<>\s*$/gm, '<div>');
  content = content.replace(/^\s*</>\s*$/gm, '</div>');
  
  // Fix empty fragments
  content = content.replace(/<>\s*</>/g, '<div></div>');
  
  // Fix unclosed fragments
  content = content.replace(/<>([^<]*?)$/gm, '<div>$1');
  content = content.replace(/^([^>]*?)</>/gm, '$1</div>');
  
  // Ensure React import if JSX is used
  if (content.includes('<') && content.includes('>') && !content.includes('import React')) {
    content = "import React from 'react';\n" + content;
  }
  
  return content;
}

// Function to restore a file with JSX fixes
function restoreFileWithFixes(sourcePath, targetPath) {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.log(`❌ Source file not found: ${sourcePath}`);
      return false;
    }
    
    let content = fs.readFileSync(sourcePath, 'utf8');
    content = fixJSXIssues(content);
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, content);
    console.log(`✅ Restored: ${targetPath}`);
    return true;
  } catch (error) {
    console.log(`❌ Error restoring ${targetPath}: ${error.message}`);
    return false;
  }
}

console.log('🚀 Starting restoration of main areas...\n');

// Restore User area pages
console.log('📁 Restoring User area...');
const userPages = [
  'dashboard.tsx',
  'settings.tsx',
  'plans.tsx',
  'operations.tsx',
  'credentials.tsx'
];

let userSuccessCount = 0;
userPages.forEach(page => {
  const sourcePath = path.join(__dirname, 'backup-files', 'user.backup', page);
  const targetPath = path.join(__dirname, 'pages', 'user', page);
  if (restoreFileWithFixes(sourcePath, targetPath)) {
    userSuccessCount++;
  }
});

console.log(`User area: ${userSuccessCount}/${userPages.length} pages restored\n`);

// Restore Affiliate area pages
console.log('📁 Restoring Affiliate area...');
const affiliatePages = [
  'dashboard.tsx',
  'commissions.tsx',
  'viral.tsx'
];

let affiliateSuccessCount = 0;
affiliatePages.forEach(page => {
  const sourcePath = path.join(__dirname, 'backup-files', 'affiliate.backup', page);
  const targetPath = path.join(__dirname, 'pages', 'affiliate', page);
  if (restoreFileWithFixes(sourcePath, targetPath)) {
    affiliateSuccessCount++;
  }
});

console.log(`Affiliate area: ${affiliateSuccessCount}/${affiliatePages.length} pages restored\n`);

// Restore some additional admin pages from backup
console.log('📁 Restoring additional Admin pages...');
const adminPages = [
  'accounting.tsx',
  'affiliates.tsx',
  'ai-reports.tsx',
  'alertas.tsx',
  'revenue.tsx',
  'users.tsx'
];

let adminSuccessCount = 0;
adminPages.forEach(page => {
  const sourcePath = path.join(__dirname, 'backup-files', 'admin.backup', page);
  const targetPath = path.join(__dirname, 'pages', 'admin', page);
  if (restoreFileWithFixes(sourcePath, targetPath)) {
    adminSuccessCount++;
  }
});

console.log(`Additional admin pages: ${adminSuccessCount}/${adminPages.length} pages restored\n`);

// Restore signup page
console.log('📁 Restoring signup page...');
const signupSource = path.join(__dirname, 'backup-files', 'signup.tsx.backup');
const signupTarget = path.join(__dirname, 'pages', 'signup.tsx');
const signupRestored = restoreFileWithFixes(signupSource, signupTarget);

console.log(`Signup page: ${signupRestored ? 'restored' : 'failed'}\n`);

console.log('📊 Summary:');
console.log(`User area: ${userSuccessCount}/${userPages.length} pages`);
console.log(`Affiliate area: ${affiliateSuccessCount}/${affiliatePages.length} pages`);
console.log(`Admin pages: ${adminSuccessCount}/${adminPages.length} pages`);
console.log(`Signup page: ${signupRestored ? 'restored' : 'failed'}`);

const totalRestored = userSuccessCount + affiliateSuccessCount + adminSuccessCount + (signupRestored ? 1 : 0);
const totalPages = userPages.length + affiliatePages.length + adminPages.length + 1;

console.log(`\n🎯 Total: ${totalRestored}/${totalPages} pages restored successfully`);

if (totalRestored > 0) {
  console.log('\n✅ Some pages restored successfully! Testing build...');
} else {
  console.log('\n❌ No pages were restored successfully.');
}
