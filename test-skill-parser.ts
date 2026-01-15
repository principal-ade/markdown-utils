import { parseSkillMarkdown } from './dist/esm/index.js';

const testSkill = `---
name: Legal Review
description: Review contracts and legal documents for potential issues and compliance
license: MIT
compatibility: ">=1.0.0"
allowed-tools:
  - document-reader
  - legal-db-search
metadata:
  author: AI Team
  version: "1.0.0"
---

# Legal Review Skill

This skill enables AI agents to review legal documents for compliance and potential issues.

## Capabilities

- Identify contractual obligations
- Check regulatory compliance
- Flag ambiguous clauses
`;

try {
  const parsed = parseSkillMarkdown(testSkill);
  console.log('✓ Parse successful');
  console.log('Name:', parsed.metadata.name);
  console.log('Description:', parsed.metadata.description);
  console.log('License:', parsed.metadata.license);
  console.log('Allowed tools:', parsed.metadata['allowed-tools']);
  console.log('Metadata:', parsed.metadata.metadata);
  console.log('Body length:', parsed.body.length);
  console.log('Body preview:', parsed.body.substring(0, 100) + '...');
} catch (error) {
  console.error('✗ Parse failed:', error);
}
