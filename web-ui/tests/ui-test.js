// jcode Web UI Playwright Tests
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:9527';

async function runTests() {
  console.log('=== jcode Web UI Automated Tests ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(15000);

  const results = [];
  const pass = () => { results.push({ name: currentTest, status: 'PASS' }); console.log('✓ ' + currentTest); };
  const fail = (msg) => { results.push({ name: currentTest, status: 'FAIL', msg }); console.log('✗ ' + currentTest + ': ' + msg); };

  let currentTest = '';

  // Test 1: Load Web UI
  currentTest = 'Load Web UI';
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500);
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
    const routingBadge = await page.$('#modelRoutingModeBadge');
    const routingUiLoaded = await page.evaluate(() => typeof ModelRoutingUI !== 'undefined');
    if (brand === 'jcode' && modelSelect && routingBadge && routingUiLoaded) {
      pass();
    } else {
      fail('Missing header elements');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 4: Header Model Routing Sync
  currentTest = 'Header Model Routing Sync';
  try {
    await page.selectOption('#modelSelect', 'gpt-5.5');
    await page.waitForTimeout(100);
    const stored = await page.evaluate(() => ModelRoutingStore.snapshot());
    const badge = await page.textContent('#modelRoutingModeBadge');
    await page.evaluate(() => ModelRoutingStore.save({ defaultModel: 'local-custom-model' }));
    await page.waitForTimeout(100);
    const customValue = await page.inputValue('#modelSelect');
    await page.evaluate(() => ModelRoutingStore.save({ defaultModel: 'gpt-5.5' }));
    if (stored.defaultModel === 'gpt-5.5' && badge.includes('Role') && customValue === 'local-custom-model') {
      pass();
    } else {
      fail('Header model selection did not update routing store');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 5: Composer Route Awareness
  currentTest = 'Composer Route Awareness';
  try {
    const routePlan = await page.$('.composer-route-plan');
    const routeText = await page.textContent('.composer-route-plan');
    await page.evaluate(() => ModelRoutingStore.save({
      routingMode: 'fallback',
      defaultModel: 'gpt-5.5',
      executionModel: 'gpt-5.3-codex-spark'
    }));
    await page.waitForTimeout(100);
    const updatedText = await page.textContent('.composer-route-plan');
    await page.click('.composer-route-summary');
    await page.waitForTimeout(200);
    const settingsText = await page.textContent('.settings-body');
    if (routePlan && routeText.includes('Route') && updatedText.includes('Fallback first') && updatedText.includes('Spark') && settingsText.includes('Model Routing')) {
      pass();
    } else {
      fail('Composer route plan did not render or sync model routing');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 6: Lane Navigator
  currentTest = 'Starter Intent Templates';
  try {
    const starterCount = await page.$$eval('.session-starter-card', cards => cards.length);
    await page.click('.session-starter-card[data-template="plan"]');
    await page.waitForTimeout(100);
    const composerValue = await page.evaluate(() => document.querySelector('.surface-container[data-surface-kind="agent-session"] .composer-input')?.value || '');
    const starterLabels = await page.$$eval('.session-starter-card strong', labels => labels.map(label => label.textContent.trim()).join('|'));
    if (starterCount >= 4 && composerValue.includes('Plan this change before editing') && starterLabels.includes('Execute change') && starterLabels.includes('Diagnose failure')) {
      pass();
    } else {
      fail('Starter templates did not render or fill the composer');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 7: Lane Navigator
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

  // Test 8: Create New Lane (mock window.prompt)
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

  // Test 9: New Session Button
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

  // Test 10: Settings Button
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

  // Test 11: Runtime Button
  currentTest = 'Runtime Button';
  try {
    const runtimeBtn = await page.$('#openRuntimeBtn');
    const protocolLoaded = await page.evaluate(() => typeof GatewayProtocol !== 'undefined');
    if (runtimeBtn && protocolLoaded) {
      pass();
    } else {
      fail('Runtime button or protocol adapter not found');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 12: Runtime Protocol Normalization
  currentTest = 'Runtime Protocol Normalization';
  try {
    const normalized = await page.evaluate(() => {
      const event = GatewayProtocol.normalizeRuntimeEvent({
        type: 'compaction',
        trigger: 'background',
        tokens_saved: 128,
        pre_tokens: 1024,
        post_tokens: 896
      });
      return {
        title: event.title,
        status: event.status,
        detail: event.detail,
        saved: event.metricUpdates.compaction.tokensSaved
      };
    });
    if (normalized.title === 'Context compacted' && normalized.status === 'warning' && normalized.saved === 128) {
      pass();
    } else {
      fail('Unexpected normalized event: ' + JSON.stringify(normalized));
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 13: Runtime Collaboration and Performance Panels
  currentTest = 'Runtime Collaboration and Performance Panels';
  try {
    await page.evaluate(() => document.getElementById('openRuntimeBtn')?.click());
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      RuntimeStore.updateMetrics({
        swarmMembers: [
          { id: 'planner', status: 'active', model: 'claude-opus-4-7' },
          { id: 'executor', status: 'blocked', model: 'claude-sonnet-4-7' }
        ],
        planItems: [
          { title: 'Route planning work', status: 'running' },
          { title: 'Verify UI state', status: 'pending' }
        ],
        eventCounts: { swarm_status: 1, tool_start: 2 },
        activeTools: [{ id: 'tool-1', name: 'shell', status: 'running' }],
        recentTools: [{ id: 'tool-2', name: 'build', status: 'done' }],
        messageCount: 12,
        errorCount: 1,
        lastError: 'sample warning',
        lastEventAt: Date.now(),
        phase: 'running tool'
      });
    });
    await page.waitForTimeout(200);
    const runtimeText = await page.textContent('.runtime-surface-body');
    if (runtimeText.includes('Model Routing') && runtimeText.includes('GPT-5.5') && runtimeText.includes('Collaboration') && runtimeText.includes('Workspace Performance') && runtimeText.includes('planner') && runtimeText.includes('Events')) {
      pass();
    } else {
      fail('Runtime panels did not render expected metrics');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 14: Mobile Horizontal Overflow
  currentTest = 'Workspace Runtime Inspector';
  try {
    await page.evaluate(() => {
      RuntimeStore.updateMetrics({
        phase: 'running tool',
        activeTools: [{ id: 'tool-inspector-1', name: 'shell', status: 'running' }],
        recentTools: [{ id: 'tool-inspector-2', name: 'build', status: 'done' }],
        swarmMembers: [
          { id: 'planner', status: 'active', model: 'gpt-5.5' },
          { id: 'reviewer', status: 'blocked', model: 'claude-opus-4-7' }
        ],
        planItems: [
          { title: 'Inspect runtime state', status: 'running' },
          { title: 'Verify route hints', status: 'pending' }
        ],
        messageCount: 12,
        errorCount: 1,
        lastError: 'sample warning',
        lastEventAt: Date.now()
      });
      RuntimeStore.addEvent({
        type: 'tool_start',
        title: 'Inspector tool started',
        status: 'running',
        detail: 'shell'
      });
      ModelRoutingStore.save({
        routingMode: 'fallback',
        defaultModel: 'gpt-5.5',
        executionModel: 'gpt-5.3-codex-spark'
      });
    });
    await page.waitForTimeout(200);
    const inspectorText = await page.textContent('#runtimeInspector');
    await page.click('#runtimeInspectorOpenRuntime');
    await page.waitForTimeout(200);
    const runtimeSurface = await page.$('.runtime-surface-body');
    if (inspectorText.includes('running tool') && inspectorText.includes('Fallback first') && inspectorText.includes('Spark') && inspectorText.includes('shell') && inspectorText.includes('Workflow') && inspectorText.includes('Planning') && inspectorText.includes('Execution') && inspectorText.includes('Fallback') && runtimeSurface) {
      pass();
    } else {
      fail('Runtime inspector did not sync runtime metrics, route hints, or full runtime action');
    }
  } catch (e) {
    fail(e.message);
  }

  // Test 15: Mobile Horizontal Overflow
  currentTest = 'Mobile Horizontal Overflow';
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      vertical: document.documentElement.scrollHeight > document.documentElement.clientHeight
    }));
    if (!overflow.horizontal && !overflow.vertical) {
      pass();
    } else {
      fail('Mobile layout overflows: ' + JSON.stringify(overflow));
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  } catch (e) {
    fail(e.message);
  }

  // Test 16: CSS Loading
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

  // Test 17: Console Errors Check (excluding expected 401 from API calls)
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
  await page.reload({ waitUntil: 'domcontentloaded' });
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
