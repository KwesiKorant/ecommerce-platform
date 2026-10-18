/**
 * Automated Evaluator Verification Suite (AC-1 through AC-8)
 * Arcfield Application Architecture Standard (Arc-AA)
 * Zero-dependency native Node.js test runner
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    testsPassed++;
  }
}

// Generates unique randomized IP to prevent rate limit cross-contamination across test cases
function randomIp() {
  const o3 = Math.floor(Math.random() * 250) + 1;
  const o4 = Math.floor(Math.random() * 250) + 1;
  return `10.42.${o3}.${o4}`;
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("🚀 Starting Arc-AA Automated API Verification Suite");
  console.log(`Target: ${BASE_URL}`);
  console.log("========================================================\n");

  let adminCookie = "";
  let customerCookie = "";
  let customer2Cookie = "";
  let testProductId = "";
  let initialStock = 0;
  let testProductPrice = 0;
  let createdOrderId = "";

  // -------------------------------------------------------------
  // AC-1: Public catalog browsing, keyword search tokenization & category filtering
  // -------------------------------------------------------------
  console.log("\n[TEST 1] AC-1: Catalog Browsing, Search & Filtering");
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products?limit=10`, {
      headers: { "X-Forwarded-For": randomIp() },
    });
    const json = await res.json();

    assert(res.status === 200, "GET /api/v1/products returns HTTP 200");
    assert(json.success === true, "Response envelope contains success: true");
    assert(Array.isArray(json.data.products), "Returns array of products");
    assert(json.data.products.length > 0, "Catalog contains seeded products");

    // Pick first product for subsequent mutation tests
    const sample = json.data.products.find((p) => p.stock >= 5) || json.data.products[0];
    testProductId = sample.id;
    initialStock = sample.stock;
    testProductPrice = sample.price;

    // Test multi-token search
    const searchRes = await fetch(`${BASE_URL}/api/v1/products?search=Mechanical Keyboard`, {
      headers: { "X-Forwarded-For": randomIp() },
    });
    const searchJson = await searchRes.json();
    assert(searchRes.status === 200, "Search query returns HTTP 200");
    assert(
      searchJson.data.products.some((p) => p.title.toLowerCase().includes("keyboard")),
      "Multi-word token search matches expected product"
    );

    // Test category listing
    const catRes = await fetch(`${BASE_URL}/api/v1/categories`, {
      headers: { "X-Forwarded-For": randomIp() },
    });
    const catJson = await catRes.json();
    assert(catRes.status === 200, "GET /api/v1/categories returns HTTP 200");
    assert(catJson.data.categories.length >= 5, "Returns 5 seeded categories");
  } catch (err) {
    console.error("AC-1 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-2: User Authentication, Session Cookies & Unauthenticated Rejection
  // -------------------------------------------------------------
  console.log("\n[TEST 2] AC-2: Authentication & Session Issuance");
  try {
    // 1. Login Customer
    const custLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        email: "customer@arcfield.com",
        password: "CustomerPass123!",
      }),
    });
    const custLoginJson = await custLoginRes.json();
    assert(custLoginRes.status === 200, "Customer login returns HTTP 200");
    assert(custLoginJson.data.user.role === "CUSTOMER", "User role is CUSTOMER");

    const custSetCookie = custLoginRes.headers.get("set-cookie") || "";
    customerCookie = custSetCookie.split(";")[0];
    assert(customerCookie.includes("ecom_session="), "Set-Cookie issues ecom_session cookie");

    // 2. Login Admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        email: "admin@arcfield.com",
        password: "AdminPass123!",
      }),
    });
    const adminLoginJson = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, "Admin login returns HTTP 200");
    assert(adminLoginJson.data.user.role === "ADMIN", "Admin user role is ADMIN");
    adminCookie = (adminLoginRes.headers.get("set-cookie") || "").split(";")[0];

    // 3. Register second customer for Anti-IDOR testing
    const uniqueEmail = `shopper_${Date.now()}@example.com`;
    const cust2Res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        email: uniqueEmail,
        password: "SecureShopperPass123!",
        fullName: "Second Shopper",
      }),
    });
    assert(cust2Res.status === 201, "New user registration returns HTTP 201");
    customer2Cookie = (cust2Res.headers.get("set-cookie") || "").split(";")[0];

    // 4. Verify unauthenticated checkout is rejected (401)
    const unauthOrderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        items: [{ productId: testProductId, quantity: 1 }],
        shippingAddress: {
          fullName: "Guest",
          addressLine1: "123 Street",
          city: "Accra",
          postalCode: "00233",
          country: "Ghana",
        },
      }),
    });
    assert(unauthOrderRes.status === 401, "Unauthenticated checkout request rejected with HTTP 401");
  } catch (err) {
    console.error("AC-2 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-3: Price Tampering Attack Defense (Zero Client Price Trust)
  // -------------------------------------------------------------
  console.log("\n[TEST 3] AC-3: Price Tampering Defense (Anti-Tampering)");
  try {
    const maliciousPayload = {
      items: [{ productId: testProductId, quantity: 1, unitPrice: 0.01, price: 0.01 }],
      totalAmount: 0.01,
      shippingAddress: {
        fullName: "Tamper Attacker",
        addressLine1: "100 Exploit Road",
        city: "Accra",
        postalCode: "GA-001",
        country: "Ghana",
      },
    };

    const tamperRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify(maliciousPayload),
    });

    const tamperJson = await tamperRes.json();
    assert(tamperRes.status === 201, "Order placed successfully (payload sanitized)");
    assert(
      Math.abs(tamperJson.data.totalAmount - testProductPrice) < 0.01,
      `Injected $0.01 price ignored; server calculated true total ($${tamperJson.data.totalAmount} === $${testProductPrice})`
    );

    createdOrderId = tamperJson.data.id;
  } catch (err) {
    console.error("AC-3 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-4: Atomic Inventory Decrement
  // -------------------------------------------------------------
  console.log("\n[TEST 4] AC-4: Atomic Inventory Decrement");
  try {
    const checkProductRes = await fetch(`${BASE_URL}/api/v1/products/${testProductId}`, {
      headers: { "X-Forwarded-For": randomIp() },
    });
    const checkProductJson = await checkProductRes.json();
    const currentStock = checkProductJson.data.product.stock;

    assert(
      currentStock === initialStock - 1,
      `Inventory decremented atomically from ${initialStock} to ${currentStock}`
    );
  } catch (err) {
    console.error("AC-4 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-5: Insufficient Stock Rejection (HTTP 409 Conflict)
  // -------------------------------------------------------------
  console.log("\n[TEST 5] AC-5: Insufficient Stock Bounds Rejection");
  try {
    const excessQuantityRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        items: [{ productId: testProductId, quantity: 99 }], // Exceeds stock
        shippingAddress: {
          fullName: "Stock Tester",
          addressLine1: "100 Warehouse Way",
          city: "Accra",
          postalCode: "GA-002",
          country: "Ghana",
        },
      }),
    });

    const excessJson = await excessQuantityRes.json();
    assert(excessQuantityRes.status === 409, "Order exceeding stock rejected with HTTP 409 CONFLICT");
    assert(
      excessJson.error === "INSUFFICIENT_STOCK" || excessJson.error === "CONFLICT",
      "Returns INSUFFICIENT_STOCK error code"
    );
  } catch (err) {
    console.error("AC-5 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-6: Strict Anti-IDOR Isolation
  // -------------------------------------------------------------
  console.log("\n[TEST 6] AC-6: Mathematical Anti-IDOR Customer Isolation");
  try {
    // Customer 2 attempts to inspect Customer 1's order receipt
    const idorRes = await fetch(`${BASE_URL}/api/v1/orders/${createdOrderId}`, {
      headers: {
        Cookie: customer2Cookie,
        "X-Forwarded-For": randomIp(),
      },
    });

    assert(
      idorRes.status === 404,
      "Customer B attempting to read Customer A's order receives HTTP 404 NOT_FOUND"
    );

    // Customer 1 querying their own order succeeds
    const legitimateRes = await fetch(`${BASE_URL}/api/v1/orders/${createdOrderId}`, {
      headers: {
        Cookie: customerCookie,
        "X-Forwarded-For": randomIp(),
      },
    });
    assert(legitimateRes.status === 200, "Customer A querying their own order receipt receives HTTP 200");
  } catch (err) {
    console.error("AC-6 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-7: Administrative RBAC Enforcement
  // -------------------------------------------------------------
  console.log("\n[TEST 7] AC-7: Administrative RBAC Enforcement");
  try {
    // Customer attempts to call admin product creation
    const unauthorizedProductRes = await fetch(`${BASE_URL}/api/v1/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        title: "Malicious Product Creation",
        description: "Attempted creation by non-admin customer",
        price: 99.99,
        stock: 10,
        imageUrl: "https://example.com/test.jpg",
        categoryId: "cat_1",
      }),
    });

    assert(
      unauthorizedProductRes.status === 403,
      "Non-admin customer calling POST /api/v1/products receives HTTP 403 FORBIDDEN"
    );

    // Admin calling product creation succeeds
    const categoriesRes = await fetch(`${BASE_URL}/api/v1/categories`, {
      headers: { "X-Forwarded-For": randomIp() },
    });
    const categoriesJson = await categoriesRes.json();
    const validCategoryId = categoriesJson.data.categories[0].id;

    const adminProductRes = await fetch(`${BASE_URL}/api/v1/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        title: `Admin Test Product ${Date.now()}`,
        description: "Officially created test product by verified administrator.",
        price: 129.99,
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        categoryId: validCategoryId,
      }),
    });

    assert(adminProductRes.status === 201, "Admin calling POST /api/v1/products receives HTTP 201 CREATED");

    // Option B SoD: Admin calling POST /api/v1/orders receives HTTP 403 Forbidden
    const adminOrderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "X-Forwarded-For": randomIp(),
      },
      body: JSON.stringify({
        items: [{ productId: testProductId, quantity: 1 }],
        shippingAddress: {
          fullName: "Admin User",
          addressLine1: "Admin HQ",
          city: "Accra",
          postalCode: "00233",
          country: "Ghana",
        },
      }),
    });
    const adminOrderJson = await adminOrderRes.json();
    assert(adminOrderRes.status === 403, "Admin attempting checkout receives HTTP 403 FORBIDDEN (Option B)");
    assert(adminOrderJson.error === "ADMIN_CHECKOUT_PROHIBITED", "Returns ADMIN_CHECKOUT_PROHIBITED error code");
  } catch (err) {
    console.error("AC-7 Error:", err.message);
  }

  // -------------------------------------------------------------
  // AC-8: Rate Limit Enforcement & Security Headers
  // -------------------------------------------------------------
  console.log("\n[TEST 8] AC-8: Security Headers & Rate Limit Enforcement");
  try {
    const secRes = await fetch(`${BASE_URL}/api/v1/products`, {
      headers: { "X-Forwarded-For": randomIp() },
    });

    // Check mandatory security & privacy headers
    assert(secRes.headers.get("x-content-type-options") === "nosniff", "Header X-Content-Type-Options: nosniff present");
    assert(secRes.headers.get("x-frame-options") === "DENY", "Header X-Frame-Options: DENY present");
    assert(
      (secRes.headers.get("cache-control") || "").includes("no-store"),
      "Financial privacy Cache-Control: no-store present"
    );
    assert(secRes.headers.get("pragma") === "no-cache", "Header Pragma: no-cache present");

    // Rate Limit Quota Exhaustion Test
    const floodIp = `192.168.99.${Math.floor(Math.random() * 200) + 1}`;
    let rateLimitHit = false;

    // Checkout rate limit quota is 10/min
    for (let i = 0; i < 12; i++) {
      const floodRes = await fetch(`${BASE_URL}/api/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: customerCookie,
          "X-Forwarded-For": floodIp,
        },
        body: JSON.stringify({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: "Flood Tester",
            addressLine1: "100 Flood Avenue",
            city: "Accra",
            postalCode: "GA-999",
            country: "Ghana",
          },
        }),
      });

      if (floodRes.status === 429) {
        rateLimitHit = true;
        const retryAfter = floodRes.headers.get("retry-after");
        assert(retryAfter !== null, `HTTP 429 response contains Retry-After header (${retryAfter}s)`);
        break;
      }
    }

    assert(rateLimitHit, "Rapid burst requests trigger HTTP 429 RATE_LIMIT_EXCEEDED");
  } catch (err) {
    console.error("AC-8 Error:", err.message);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n========================================================");
  console.log(`Evaluation Completed: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("========================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
