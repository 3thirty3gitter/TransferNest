/**
 * Test the nesting algorithm by making direct requests to the API
 * Run with: node test-nesting-api.mjs
 */

import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 5009;

function makeRequest(path, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            body: parsed
          });
        } catch (e) {
          console.log(`Parse error on status ${res.statusCode}: ${e.message}`);
          console.log(`Raw data: ${data.substring(0, 200)}`);
          resolve({
            status: res.statusCode,
            body: { error: 'Parse error', raw: data.substring(0, 100) }
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Nesting Algorithm Tests\n');
  console.log(`Connecting to ${API_HOST}:${API_PORT}...\n`);

  const tests = [];

  // Test 1: Single image
  tests.push({
    name: 'Single image packing',
    payload: {
      images: [
        {
          id: 'img1',
          url: 'test.jpg',
          width: 500,
          height: 300,
          copies: 1,
        }
      ],
      sheetWidth: 2000
    }
  });

  // Test 2: Multiple images with copies
  tests.push({
    name: 'Multiple images (2 copies + 1)',
    payload: {
      images: [
        {
          id: 'img1',
          url: 'test1.jpg',
          width: 500,
          height: 300,
          copies: 2,
        },
        {
          id: 'img2',
          url: 'test2.jpg',
          width: 400,
          height: 400,
          copies: 1,
        }
      ],
      sheetWidth: 2000
    }
  });

  // Test 3: Large batch with squares
  tests.push({
    name: 'Dense packing (5 squares)',
    payload: {
      images: [
        {
          id: 'square1',
          url: 'sq1.jpg',
          width: 400,
          height: 400,
          copies: 3,
        },
        {
          id: 'square2',
          url: 'sq2.jpg',
          width: 400,
          height: 400,
          copies: 2,
        }
      ],
      sheetWidth: 2000
    }
  });

  // Test 4: Mixed orientations
  tests.push({
    name: 'Mixed orientations (portrait/landscape)',
    payload: {
      images: [
        {
          id: 'portrait',
          url: 'port.jpg',
          width: 300,
          height: 500,
          copies: 2,
        },
        {
          id: 'landscape',
          url: 'land.jpg',
          width: 600,
          height: 400,
          copies: 2,
        }
      ],
      sheetWidth: 2000
    }
  });

  // Test 5: Large batch
  tests.push({
    name: 'Large batch (10 items)',
    payload: {
      images: [
        {
          id: 'img1',
          url: 'test1.jpg',
          width: 600,
          height: 400,
          copies: 4,
        },
        {
          id: 'img2',
          url: 'test2.jpg',
          width: 500,
          height: 500,
          copies: 3,
        },
        {
          id: 'img3',
          url: 'test3.jpg',
          width: 300,
          height: 300,
          copies: 3,
        }
      ],
      sheetWidth: 2000
    }
  });

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest('/api/nesting', 'POST', test.payload);

      if (result.status !== 200) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: HTTP ${result.status}`);
        if (result.body && result.body.error) {
          console.log(`   ${result.body.error}`);
        }
        failed++;
        continue;
      }

      const data = result.body;
      
      if (!data || !data.placedItems || data.sheetLength === undefined) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: Invalid response structure`);
        console.log(`   Response:`, JSON.stringify(data).substring(0, 150));
        failed++;
        continue;
      }

      const totalItems = test.payload.images.reduce((sum, img) => sum + img.copies, 0);
      const placed = data.placedItems.length;
      const failedItems = data.failedCount;
      const utilization = (data.areaUtilizationPct * 100).toFixed(2);

      console.log(`✅ ${test.name}`);
      console.log(`   Items: ${placed}/${totalItems} (${failedItems} failed)`);
      console.log(`   Sheet: ${data.sheetLength}mm`);
      console.log(`   Utilization: ${utilization}%`);

      // Check for rotation
      const rotatedCount = data.placedItems.filter(item => item.rotated).length;
      if (rotatedCount > 0) {
        console.log(`   Rotations: ${rotatedCount} images rotated`);
      }

      // Warn if utilization is low
      if (data.areaUtilizationPct < 0.5) {
        console.log(`   ⚠️  Low utilization (< 50%)`);
      }

      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }

    console.log();
  }

  console.log(`${'='.repeat(60)}`);
  console.log(`RESULTS: ${passed}/${tests.length} tests passed`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} test(s) failed`);
  } else {
    console.log(`🎉 All tests passed!`);
  }
  console.log(`${'='.repeat(60)}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error(`Error: ${error.message}`);
  console.log(`Make sure the dev server is running: npm run dev`);
  process.exit(1);
});
