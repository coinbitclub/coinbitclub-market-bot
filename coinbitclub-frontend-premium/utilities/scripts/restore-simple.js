const fs = require('fs');
const path = require('path');

// Function to restore a file
function restoreFile(sourcePath, targetPath) {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.log(`❌ Source file not found: ${sourcePath}`);
      return false;
    }
    
    let content = fs.readFileSync(sourcePath, 'utf8');
    
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
  'plans.tsx'
];

let userSuccessCount = 0;
userPages.forEach(page => {
  const sourcePath = path.join(__dirname, 'backup-files', 'user.backup', page);
  const targetPath = path.join(__dirname, 'pages', 'user', page);
  if (restoreFile(sourcePath, targetPath)) {
    userSuccessCount++;
  }
});

console.log(`User area: ${userSuccessCount}/${userPages.length} pages restored\n`);

// Restore Affiliate area pages
console.log('📁 Restoring Affiliate area...');
const affiliatePages = [
  'dashboard.tsx',
  'commissions.tsx'
];

let affiliateSuccessCount = 0;
affiliatePages.forEach(page => {
  const sourcePath = path.join(__dirname, 'backup-files', 'affiliate.backup', page);
  const targetPath = path.join(__dirname, 'pages', 'affiliate', page);
  if (restoreFile(sourcePath, targetPath)) {
    affiliateSuccessCount++;
  }
});

console.log(`Affiliate area: ${affiliateSuccessCount}/${affiliatePages.length} pages restored\n`);

// Restore signup page
console.log('📁 Restoring signup page...');
const signupSource = path.join(__dirname, 'backup-files', 'signup.tsx.backup');
const signupTarget = path.join(__dirname, 'pages', 'signup.tsx');
const signupRestored = restoreFile(signupSource, signupTarget);

console.log(`Signup page: ${signupRestored ? 'restored' : 'failed'}\n`);

console.log('📊 Summary:');
console.log(`User area: ${userSuccessCount}/${userPages.length} pages`);
console.log(`Affiliate area: ${affiliateSuccessCount}/${affiliatePages.length} pages`);
console.log(`Signup page: ${signupRestored ? 'restored' : 'failed'}`);

const totalRestored = userSuccessCount + affiliateSuccessCount + (signupRestored ? 1 : 0);
const totalPages = userPages.length + affiliatePages.length + 1;

console.log(`\n🎯 Total: ${totalRestored}/${totalPages} pages restored successfully`);

if (totalRestored > 0) {
  console.log('\n✅ Pages restored successfully! Now testing build...');
} else {
  console.log('\n❌ No pages were restored successfully.');
}
