// jcode Web UI Button Functionality Tests
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:9527';

async function runTests() {
  console.log('=== jcode Web UI Button Functionality Tests ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  const pass = (name, msg) => { results.push({ name, status: 'PASS', msg }); console.log(`✓ ${name}${msg ? ': ' + msg : ''}`); };
  const fail = (name, msg) => { results.push({ name, status: 'FAIL', msg }); console.log(`✗ ${name}: ${msg}`); };

  // Load page
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  // Test 1: Create New Session Button
  console.log('\n--- Test: Create New Session ---');
  try {
    // Mock prompt to avoid dialogs
    await page.evaluate(() => { window.prompt = () => 'TestLane'; });

    // Get surface count before
    const beforeCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    console.log('  Surfaces before:', beforeCount);

    // Click new session button
    await page.click('#newSessionBtn');
    await page.waitForTimeout(500);

    // Get surface count after
    const afterCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    console.log('  Surfaces after:', afterCount);

    if (afterCount > beforeCount && afterCount > 0) {
      pass('Create New Session', `Surfaces: ${beforeCount} -> ${afterCount}`);
    } else {
      fail('Create New Session', 'No surface created');
    }
  } catch (e) {
    fail('Create New Session', e.message);
  }

  // Test 2: Open Settings Button
  console.log('\n--- Test: Open Settings ---');
  try {
    // Get surface count before
    const beforeCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    // Click settings button
    await page.click('#openSettingsBtn');
    await page.waitForTimeout(500);

    // Get surface count after
    const afterCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    console.log('  Surfaces before:', beforeCount, 'after:', afterCount);

    if (afterCount > beforeCount) {
      pass('Open Settings', `Surfaces: ${beforeCount} -> ${afterCount}`);
    } else {
      fail('Open Settings', 'No surface created');
    }
  } catch (e) {
    fail('Open Settings', e.message);
  }

  // Test 3: Toggle Files Button
  console.log('\n--- Test: Toggle Files ---');
  try {
    const beforeCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    await page.click('#toggleFilesBtn');
    await page.waitForTimeout(500);

    const afterCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    console.log('  Surfaces before:', beforeCount, 'after:', afterCount);

    if (afterCount > beforeCount) {
      pass('Toggle Files', `Surfaces: ${beforeCount} -> ${afterCount}`);
    } else {
      fail('Toggle Files', 'No surface created');
    }
  } catch (e) {
    fail('Toggle Files', e.message);
  }

  // Test 4: Open Runtime Button
  console.log('\n--- Test: Open Runtime ---');
  try {
    const beforeCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });

    await page.click('#openRuntimeBtn');
    await page.waitForTimeout(500);

    const afterCount = await page.evaluate(() => {
      return window.SurfaceStore ? window.SurfaceStore.surfaces.length : -1;
    });
    await page.evaluate(() => {
      RuntimeStore.recordGatewayMessage({ type: 'connection_type', connection: 'websocket' });
      RuntimeStore.recordGatewayMessage({ type: 'tool_start', id: 'tool-1', name: 'shell_command' });
      RuntimeStore.recordGatewayMessage({ type: 'tokens', input: 12, output: 34, cache_read_input: 5 });
      RuntimeStore.recordGatewayMessage({ type: 'memory_injected', count: 2, prompt_chars: 240 });
      RuntimeStore.recordGatewayMessage({ type: 'tool_done', id: 'tool-1', name: 'shell_command', output: 'ok' });
    });
    await page.waitForTimeout(100);
    const runtimeRendered = await page.$('.runtime-surface-body');
    const routingRendered = await page.$('.runtime-routing-strip');
    const toolRendered = await page.$('.runtime-tool');
    const contextRendered = await page.$('.runtime-context-grid');
    const filterRendered = await page.$('.runtime-filter[data-runtime-filter="success"]');
    const listenerCountBefore = await page.evaluate(() => RuntimeStore.listeners.length);
    const routingListenerCountBefore = await page.evaluate(() => ModelRoutingStore.listeners.length);
    await page.evaluate(() => WorkspaceController.renderActiveLane());
    await page.waitForTimeout(200);
    const listenerCountAfter = await page.evaluate(() => RuntimeStore.listeners.length);
    const routingListenerCountAfter = await page.evaluate(() => ModelRoutingStore.listeners.length);

    console.log('  Surfaces before:', beforeCount, 'after:', afterCount);

    if (afterCount > beforeCount && runtimeRendered && routingRendered && toolRendered && contextRendered && filterRendered && listenerCountAfter <= listenerCountBefore && routingListenerCountAfter <= routingListenerCountBefore) {
      pass('Open Runtime', `Surfaces: ${beforeCount} -> ${afterCount}`);
    } else {
      fail('Open Runtime', `Runtime surface did not render operational sections or leaked listeners: ${listenerCountBefore}/${routingListenerCountBefore} -> ${listenerCountAfter}/${routingListenerCountAfter}`);
    }
  } catch (e) {
    fail('Open Runtime', e.message);
  }

  // Test 5: Session Empty Actions
  console.log('\n--- Test: Session Empty Actions ---');
  try {
    await page.evaluate(() => document.querySelector('.session-empty-action[data-action="starter"]')?.click());
    const composerValue = await page.evaluate(() => document.querySelector('.surface-container[data-surface-kind="agent-session"] .composer-input')?.value || '');
    const actionCount = await page.$$eval('.session-empty-action', els => els.length);
    if (composerValue.includes('Summarize') && actionCount >= 3) {
      pass('Session Empty Actions', `Actions: ${actionCount}`);
    } else {
      fail('Session Empty Actions', `Composer value: ${composerValue || 'empty'}, actions: ${actionCount}`);
    }
  } catch (e) {
    fail('Session Empty Actions', e.message);
  }

  // Test 6: Verify Surface Store exists
  console.log('\n--- Test: Surface Store Available ---');
  const storeExists = await page.evaluate(() => typeof SurfaceStore !== 'undefined');
  if (storeExists) {
    pass('Surface Store', 'Available');
  } else {
    fail('Surface Store', 'Not found');
  }

  // Test 7: Check for surface rendering in DOM
  console.log('\n--- Test: Surface DOM Elements ---');
  try {
    const surfaceCount = await page.$$eval('.surface-container', els => els.length);
    console.log('  Surface elements in DOM:', surfaceCount);
    if (surfaceCount > 0) {
      pass('Surface Rendering', `${surfaceCount} surface(s) rendered`);
    } else {
      fail('Surface Rendering', 'No surfaces in DOM');
    }
  } catch (e) {
    fail('Surface Rendering', e.message);
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
