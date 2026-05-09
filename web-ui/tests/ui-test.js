// jcode Web UI Playwright Tests
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:9527';

async function runTests() {
  console.log('=== jcode Web UI Automated Tests ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  const pass = () => { results.push({ name: currentTest, status: 'PASS' }); };
  const fail = (msg) => { results.push({ name: currentTest, status: 'FAIL', msg }); };

  let currentTest = '';

  // Test 1: Load Web UI
  currentTest = 'Load Web UI';
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    const title = await page.title();
    if (title.includes('jcode')) {
      console.log('✓ Page loaded, title:', title);
      pass();
    } else {
      fail('Wrong title: ' + title);
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 2: Connection Status Indicator
  currentTest = 'Connection Status';
  try {
    await page.waitForTimeout(2000); // Wait for connection
    const status = await page.textContent('#connectionStatus');
    console.log('  Connection status:', status);
    const validStatuses = ['Connected', 'Connected locally', 'Connecting', 'Needs pairing', 'Gateway offline'];
    if (validStatuses.includes(status)) {
      pass();
    } else {
      fail('Unexpected status "' + status + '"');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 3: Header Elements
  currentTest = 'Header Elements';
  try {
    const brand = await page.textContent('.header-brand');
    const modelSelect = await page.$('#modelSelect');
    if (brand === 'jcode' && modelSelect) {
      pass();
    } else {
      fail('Missing header elements');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 4: Lane Navigator
  currentTest = 'Lane Navigator';
  try {
    const laneNav = await page.$('.lane-navigator');
    const addBtn = await page.$('#addLaneBtn');
    if (laneNav && addBtn) {
      const laneCount = await page.$$eval('.lane-item', items => items.length);
      console.log('  Lanes found:', laneCount);
      pass();
    } else {
      fail('Lane navigator not found');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 5: Create New Lane (mock window.prompt)
  currentTest = 'Create New Lane';
  try {
    // Mock window.prompt to return a value
    await page.evaluate(() => {
      window.prompt = () => 'TestLane';
    });

    // Count lanes before
    const lanesBefore = await page.$$eval('.lane-item', items => items.length);

    // Click the add lane button
    await page.click('#addLaneBtn');
    await page.waitForTimeout(500);

    // Count lanes after
    const lanesAfter = await page.$$eval('.lane-item', items => items.length);
    console.log('  Lanes before:', lanesBefore, 'after:', lanesAfter);

    if (lanesAfter > lanesBefore) {
      pass();
    } else {
      fail('Lane not created');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 6: New Session Button
  currentTest = 'New Session Button';
  try {
    const newSessionBtn = await page.$('#newSessionBtn');
    if (newSessionBtn) {
      const btnText = await newSessionBtn.textContent();
      console.log('  Button text:', btnText);
      pass();
    } else {
      fail('New session button not found');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 7: Settings Button
  currentTest = 'Settings Button';
  try {
    const settingsBtn = await page.$('#openSettingsBtn');
    if (settingsBtn) {
      pass();
    } else {
      fail('Settings button not found');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 8: Runtime Button
  currentTest = 'Runtime Button';
  try {
    const runtimeBtn = await page.$('#openRuntimeBtn');
    if (runtimeBtn) {
      pass();
    } else {
      fail('Runtime button not found');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 9: Mobile Horizontal Overflow
  currentTest = 'Mobile Horizontal Overflow';
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (!hasOverflow) {
      pass();
    } else {
      fail('Mobile layout overflows horizontally');
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  } catch (e) {
    fail(e.message);
  }

  // Test 10: CSS Loading
  currentTest = 'CSS Styles Loaded';
  try {
    const header = await page.$('.header');
    const styles = await header.evaluate(el => window.getComputedStyle(el).backgroundColor);
    if (styles && styles !== 'rgba(0, 0, 0, 0)') {
      pass();
    } else {
      fail('CSS not loaded properly');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 11: Console Errors Check (excluding expected 401 from API calls)
  currentTest = 'No Critical Console Errors';
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore expected offline gateway noise when tests run without jcode serve.
      if (!text.includes('401') && !text.includes('API Error') && !text.includes('net::ERR_CONNECTION_REFUSED')) {
        errors.push(text);
      }
    }
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (errors.length === 0) {
    pass();
  } else {
    fail('Console errors: ' + errors.join(', '));
  }

  // Summary
  console.log('\n=== Test Results ===');
  let passed = 0, failed = 0;
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`${icon} ${r.name}${r.msg ? ': ' + r.msg : ''}`);
    if (r.status === 'PASS') passed++;
    else failed++;
  });

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
