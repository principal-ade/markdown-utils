import { parseSkillMarkdownGraceful } from './src/utils/skill-parser';

// Test 1: Missing description
const missingDescription = `---
name: test-skill
license: MIT
---

# Test Skill
Some content here.
`;

console.log('Test 1: Missing description');
const result1 = parseSkillMarkdownGraceful(missingDescription);
console.log('Metadata:', result1.metadata);
console.log('Warnings:', result1.warnings);
console.log('');

// Test 2: Missing name
const missingName = `---
description: This is a test skill
license: MIT
---

# Test Skill
Some content here.
`;

console.log('Test 2: Missing name');
const result2 = parseSkillMarkdownGraceful(missingName);
console.log('Metadata:', result2.metadata);
console.log('Warnings:', result2.warnings);
console.log('');

// Test 3: Missing both required fields
const missingBoth = `---
license: MIT
compatibility: ">=1.0.0"
---

# Test Skill
Some content here.
`;

console.log('Test 3: Missing both required fields');
const result3 = parseSkillMarkdownGraceful(missingBoth);
console.log('Metadata:', result3.metadata);
console.log('Warnings:', result3.warnings);
console.log('');

// Test 4: Valid skill (no warnings)
const validSkill = `---
name: test-skill
description: This is a test skill
license: MIT
---

# Test Skill
Some content here.
`;

console.log('Test 4: Valid skill');
const result4 = parseSkillMarkdownGraceful(validSkill);
console.log('Metadata:', result4.metadata);
console.log('Warnings:', result4.warnings);
