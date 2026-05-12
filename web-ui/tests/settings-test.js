// jcode Web UI Settings Surface Tests
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:9527';

async function runTests() {
  console.log('=== jcode Settings Surface Tests ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  const pass = (name, msg) => { results.push({ name, status: 'PASS', msg }); console.log(`✓ ${name}${msg ? ': ' + msg : ''}`); };
  const fail = (name, msg) => { results.push({ name, status: 'FAIL', msg }); console.log(`✗ ${name}: ${msg}`); };

  // Load page and wait for connection
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  // Test 1: Open Settings Surface
  console.log('\n--- Test: Settings Surface Rendering ---');
  try {
    await page.evaluate(() => { window.prompt = () => 'TestLane'; });
    await page.click('#openSettingsBtn');
    await page.waitForTimeout(500);

    const settingsSurface = await page.$('.settings-surface, .settings-body');
    if (settingsSurface) {
      pass('Settings Surface', 'Rendered');
    } else {
      fail('Settings Surface', 'Not found');
    }
  } catch (e) {
    fail('Settings Surface', e.message);
  }

  // Test 2: Settings Tabs
  console.log('\n--- Test: Settings Tabs ---');
  try {
    const tabs = await page.$$('.settings-tab');
    console.log('  Tabs found:', tabs.length);
    if (tabs.length >= 5) {
      pass('Settings Tabs', `${tabs.length} tabs rendered`);
    } else {
      fail('Settings Tabs', `Only ${tabs.length} tabs found`);
    }
  } catch (e) {
    fail('Settings Tabs', e.message);
  }

  // Test 3: Switch to Connection Tab
  console.log('\n--- Test: Connection Tab ---');
  try {
    await page.click('.settings-tab[data-tab="connection"]');
    await page.waitForTimeout(200);

    const content = await page.textContent('#settingsContent');
    if (content.includes('Gateway') && content.includes('Status')) {
      pass('Connection Tab', 'Content rendered');
    } else {
      fail('Connection Tab', 'Content missing');
    }
  } catch (e) {
    fail('Connection Tab', e.message);
  }

  // Test 4: Switch to Model Tab
  console.log('\n--- Test: Gateway URL drives WebSocket URL ---');
  try {
    const wsUrl = await page.evaluate(() => {
      API.baseUrl = 'http://127.0.0.1:8765';
      return API.websocketUrl('/ws');
    });
    if (wsUrl === 'ws://127.0.0.1:8765/ws') {
      pass('Gateway WebSocket URL', wsUrl);
    } else {
      fail('Gateway WebSocket URL', `Unexpected URL: ${wsUrl}`);
    }
  } catch (e) {
    fail('Gateway WebSocket URL', e.message);
  }

  // Test 5: Runtime context appears in Connection Tab
  console.log('\n--- Test: Desktop Runtime Section ---');
  try {
    const content = await page.textContent('#settingsContent');
    if (content.includes('Desktop Runtime') && content.includes('Start command')) {
      pass('Desktop Runtime Section', 'Rendered');
    } else {
      fail('Desktop Runtime Section', 'Missing runtime diagnostics');
    }
  } catch (e) {
    fail('Desktop Runtime Section', e.message);
  }

  // Test 6: Switch to Model Tab
  console.log('\n--- Test: Model Tab ---');
  try {
    await page.click('.settings-tab[data-tab="model"]');
    await page.waitForTimeout(200);

    const modelSelect = await page.$('#setting_defaultModel');
    if (modelSelect) {
      const value = await modelSelect.inputValue();
      const planning = await page.$('#setting_planningModel');
      const preview = await page.textContent('#modelRoutePreview');
      if (planning && preview.includes('"planning"')) {
        pass('Model Tab', `Default model: ${value}`);
      } else {
        fail('Model Tab', 'Routing fields incomplete');
      }
    } else {
      fail('Model Tab', 'Model select not found');
    }
  } catch (e) {
    fail('Model Tab', e.message);
  }

  // Test 7: Model routing persistence
  console.log('\n--- Test: Model Routing Persistence ---');
  try {
    await page.selectOption('#setting_executionModel', 'gpt-5.3-codex-spark');
    await page.evaluate(() => {
      const input = document.querySelector('input[name="routingMode"][value="fallback"]');
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.click('#saveModelRoutingBtn');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('jcode_model_routing')));
    if (stored.executionModel === 'gpt-5.3-codex-spark' && stored.routingMode === 'fallback') {
      pass('Model Routing Persistence', `${stored.routingMode}: ${stored.executionModel}`);
    } else {
      fail('Model Routing Persistence', 'Stored route did not match selection');
    }
  } catch (e) {
    fail('Model Routing Persistence', e.message);
  }

  // Test 8: Shortcuts Tab
  console.log('\n--- Test: Shortcuts Tab ---');
  try {
    await page.click('.settings-tab[data-tab="shortcuts"]');
    await page.waitForTimeout(200);

    const shortcuts = await page.$$('.shortcut-item');
    console.log('  Shortcuts found:', shortcuts.length);
    if (shortcuts.length > 0) {
      pass('Shortcuts Tab', `${shortcuts.length} shortcuts`);
    } else {
      fail('Shortcuts Tab', 'No shortcuts found');
    }
  } catch (e) {
    fail('Shortcuts Tab', e.message);
  }

  // Test 9: About Tab
  console.log('\n--- Test: About Tab ---');
  try {
    await page.click('.settings-tab[data-tab="about"]');
    await page.waitForTimeout(200);

    const aboutTitle = await page.$('.about-title');
    if (aboutTitle) {
      const title = await aboutTitle.textContent();
      pass('About Tab', title);
    } else {
      fail('About Tab', 'About title not found');
    }
  } catch (e) {
    fail('About Tab', e.message);
  }

  // Test 10: Reconnect Button
  console.log('\n--- Test: Reconnect Button ---');
  try {
    // Switch to connection tab first
    await page.click('.settings-tab[data-tab="connection"]');
    await page.waitForTimeout(200);

    const reconnectBtn = await page.$('#reconnectBtn');
    if (reconnectBtn) {
      pass('Reconnect Button', 'Present');
    } else {
      fail('Reconnect Button', 'Not found');
    }
  } catch (e) {
    fail('Reconnect Button', e.message);
  }

  // Test 11: Close Settings Surface
  console.log('\n--- Test: Close Settings ---');
  try {
    const surfaceCountBefore = await page.$$eval('.surface-container', els => els.length);

    // Click close button on settings surface (selector based on surface kind)
    const closeBtn = await page.$('.surface-container[data-surface-kind="settings"] [data-action="close"]');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(300);

      const surfaceCountAfter = await page.$$eval('.surface-container', els => els.length);
      if (surfaceCountAfter < surfaceCountBefore) {
        pass('Close Settings', `Surfaces: ${surfaceCountBefore} -> ${surfaceCountAfter}`);
      } else {
        fail('Close Settings', 'Surface not closed');
      }
    } else {
      fail('Close Settings', 'Close button not found');
    }
  } catch (e) {
    fail('Close Settings', e.message);
  }

  // Summary
  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${passed} passed, ${failed} failed`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
