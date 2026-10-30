/**
 * Test Suite 1: Validation & Reliability Tests
 */

const assert = require('assert');

// Test phone number formatting and validation
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  // Vietnam phone: 10 digits starting with 0 or 11 digits starting with +84/84
  return /^(\+?84|0)(3|5|7|8|9)[0-9]{8}$/.test(cleaned) || /^0[1-9][0-9]{8}$/.test(cleaned);
}

// Test schedule delay validation
function validateDelaySeconds(delay) {
  const num = Number(delay);
  return !isNaN(num) && num >= 0 && num <= 86400;
}

// Test situation text trimming & length bounds
function validateSituationInput(text) {
  if (!text || typeof text !== 'string') return { valid: false, error: 'Empty' };
  const trimmed = text.trim();
  if (trimmed.length < 8) return { valid: false, error: 'Too short (min 8 chars)' };
  if (trimmed.length > 800) return { valid: false, error: 'Too long (max 800 chars)' };
  return { valid: true, value: trimmed };
}

// Run Tests
function runValidationTests() {
  console.log('\n--- Running Validation Tests ---');

  // Phone tests
  assert.strictEqual(validatePhoneNumber('0903888999'), true, 'Valid 10-digit mobile');
  assert.strictEqual(validatePhoneNumber('0912 345 678'), true, 'Valid with spaces');
  assert.strictEqual(validatePhoneNumber('+84903888999'), true, 'Valid with +84');
  assert.strictEqual(validatePhoneNumber('123'), false, 'Invalid short number');
  assert.strictEqual(validatePhoneNumber(''), false, 'Empty phone number');
  console.log('✓ Phone Number Validation passed (5/5 assertions)');

  // Delay tests
  assert.strictEqual(validateDelaySeconds(0), true, 'Immediate 0s valid');
  assert.strictEqual(validateDelaySeconds(30), true, '30s valid');
  assert.strictEqual(validateDelaySeconds(300), true, '5 mins valid');
  assert.strictEqual(validateDelaySeconds(-5), false, 'Negative delay invalid');
  assert.strictEqual(validateDelaySeconds('invalid'), false, 'NaN invalid');
  console.log('✓ Scheduling Delay Validation passed (5/5 assertions)');

  // Situation input tests
  assert.strictEqual(validateSituationInput('Ngắn').valid, false);
  assert.strictEqual(validateSituationInput('Tôi đang ở bữa tiệc bị ép uống rượu cần về gấp').valid, true);
  assert.strictEqual(validateSituationInput('   khoảng trắng đầu cuối   ').value, 'khoảng trắng đầu cuối');
  console.log('✓ Situation Input Length & Trimming passed (3/3 assertions)');
}

module.exports = { runValidationTests };
if (require.main === module) runValidationTests();