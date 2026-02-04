const fs = require('fs');
const path = require('path');

console.log('=== Testing n8n-nodes-mtn-momo ===\n');

// Check package.json
const pkg = require('./package.json');
console.log('✓ Package name:', pkg.name);
console.log('✓ Version:', pkg.version);
console.log('✓ n8n API Version:', pkg.n8n.n8nNodesApiVersion);

// Check credential files
pkg.n8n.credentials.forEach((credPath) => {
  const fullPath = path.join(__dirname, credPath);
  const exists = fs.existsSync(fullPath);
  console.log(
    `${exists ? '✓' : '✗'} Credential: ${credPath} ${exists ? '' : '(MISSING!)'}`,
  );
});

// Check node files
pkg.n8n.nodes.forEach((nodePath) => {
  const fullPath = path.join(__dirname, nodePath);
  const exists = fs.existsSync(fullPath);
  console.log(
    `${exists ? '✓' : '✗'} Node: ${nodePath} ${exists ? '' : '(MISSING!)'}`,
  );

  if (exists) {
    try {
      const NodeClass = require(fullPath);
      console.log('  → Node class name:', Object.keys(NodeClass)[0]);
    } catch (e) {
      console.log('  → ERROR loading node:', e.message);
    }
  }
});

// Check icon
const iconPath = path.join(__dirname, 'dist/nodes/MtnMomo/mtnmomo.svg');
const iconExists = fs.existsSync(iconPath);
console.log(
  `${iconExists ? '✓' : '✗'} Icon: ${iconExists ? 'Found' : 'MISSING!'}`,
);

console.log('\n=== Test Complete ===');
