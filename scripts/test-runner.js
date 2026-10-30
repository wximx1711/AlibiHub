/**
 * AlibiHub - Automated Verification & Test Suite Runner
 */

const { runValidationTests } = require('../tests/validation.test');
const { runAiSchemaTests } = require('../tests/aiSchema.test');
const { runStorageTests } = require('../tests/storage.test');
const { runServerTests } = require('../tests/server.test');

async function main() {
  console.log('========================================================');
  console.log('🚀 ALIBIHUB - AUTOMATED TEST SUITE & VERIFICATION');
  console.log('========================================================');

  try {
    runValidationTests();
    runAiSchemaTests();
    await runStorageTests();
    await runServerTests();

    console.log('========================================================');
    console.log('✅ ALL TEST SUITES PASSED SUCCESSFULLY (100%)!');
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err);
    process.exit(1);
  }
}

main();