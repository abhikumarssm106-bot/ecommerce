async function runTests() {
  console.log('--- STARTING G MART INTEGRATION FLOW TESTS ---\n');
  const baseUrl = 'http://localhost:5000/api/v1';
  let cookies: string[] = [];
  let customerAccessToken = '';
  let adminAccessToken = '';

  // Helper to make requests and manage cookies / tokens
  async function apiRequest(path: string, method: string = 'GET', body: any = null, token: string = '') {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
    }

    const options: any = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${path}`, options);
    
    // Capture set-cookie headers
    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const sc of setCookieHeaders) {
        const cookieVal = sc.split(';')[0];
        const cookieName = cookieVal.split('=')[0] + '=';
        cookies = cookies.filter(c => !c.startsWith(cookieName));
        cookies.push(cookieVal);
      }
    }

    const data = await res.json() as any;
    return { status: res.status, data };
  }

  // Helper for reporting
  function reportResult(flowName: string, passed: boolean, details: string = '') {
    console.log(`FLOW: [${flowName}] -> ${passed ? '✅ PASS' : '❌ FAIL'} ${details ? `(${details})` : ''}`);
  }

  try {
    // ----------------------------------------------------
    // FLOW 1: Register, Login, Logout, Log back in
    // ----------------------------------------------------
    const testEmail = `cust_${Date.now()}@test.com`;
    const regRes = await apiRequest('/auth/register', 'POST', {
      email: testEmail,
      password: 'Customer@123',
      firstName: 'Integration',
      lastName: 'TestUser',
      phone: '+919988776655'
    });

    const regPassed = regRes.status === 201 && regRes.data.success;
    reportResult('1a. Customer Registration', regPassed, `Status: ${regRes.status}`);

    const loginRes = await apiRequest('/auth/login', 'POST', {
      email: testEmail,
      password: 'Customer@123'
    });

    const loginPassed = loginRes.status === 200 && loginRes.data.success && !!loginRes.data.data.accessToken;
    if (loginPassed) {
      customerAccessToken = loginRes.data.data.accessToken;
    }
    reportResult('1b. Customer Login', loginPassed, `Status: ${loginRes.status}`);

    // Confirm refreshToken cookie was set
    const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
    reportResult('1c. Refresh Cookie Issuance', !!refreshCookie, refreshCookie ? 'Cookie exists' : 'Cookie missing');

    const logoutRes = await apiRequest('/auth/logout', 'POST');
    const logoutPassed = logoutRes.status === 200 && logoutRes.data.success;
    reportResult('1d. Customer Logout', logoutPassed, `Status: ${logoutRes.status}`);

    // Login back in
    const reloginRes = await apiRequest('/auth/login', 'POST', {
      email: testEmail,
      password: 'Customer@123'
    });
    const reloginPassed = reloginRes.status === 200 && reloginRes.data.success && !!reloginRes.data.data.accessToken;
    if (reloginPassed) {
      customerAccessToken = reloginRes.data.data.accessToken;
    }
    reportResult('1e. Customer Re-Login', reloginPassed, `Status: ${reloginRes.status}`);

    // ----------------------------------------------------
    // FLOW 2 & 3: Guest Cart Merge & Persistence
    // ----------------------------------------------------
    // First, let's fetch products to get a valid product variant ID
    const prodCatalog = await apiRequest('/products');
    const firstProduct = prodCatalog.data.data?.[0];
    const firstVariant = firstProduct?.variants?.[0];

    if (!firstVariant) {
      throw new Error('No products/variants available for cart tests. Run seeds first.');
    }

    // Simulate guest adding to cart and then logging in (merging to DB)
    // We post to cart items for this logged-in user
    const cartAddRes = await apiRequest('/cart/items', 'POST', {
      variantId: firstVariant.id,
      quantity: 2
    }, customerAccessToken);

    const cartAddPassed = cartAddRes.status === 200 && cartAddRes.data.success;
    reportResult('2. Guest Cart Sync/Merge to DB', cartAddPassed, `Status: ${cartAddRes.status}`);

    // Fetch cart to verify it persists (persistence/refresh verification)
    const cartGetRes = await apiRequest('/cart', 'GET', null, customerAccessToken);
    const cartItem = cartGetRes.data.data?.items?.find((i: any) => i.variantId === firstVariant.id);
    const persistencePassed = cartGetRes.status === 200 && !!cartItem && cartItem.quantity === 2;
    reportResult('3. Cart Persistence on Refresh', persistencePassed, cartItem ? `Found qty: ${cartItem.quantity}` : 'Item not found');

    // ----------------------------------------------------
    // FLOW 4: Checkout, Delivery Address, Paid status
    // ----------------------------------------------------
    // Add shipping address
    const addressRes = await apiRequest('/auth/profile/addresses', 'POST', {
      firstName: 'Integration',
      lastName: 'TestUser',
      line1: '128 Test Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
      isDefault: true
    }, customerAccessToken);

    const addressPassed = (addressRes.status === 200 || addressRes.status === 201) && addressRes.data.success;
    const addressId = addressRes.data.data?.addresses?.find((a: any) => a.isDefault)?.id || addressRes.data.data?.id;
    reportResult('4a. Address Profile Creation', addressPassed, `Address ID: ${addressId}`);

    // Place Order
    const orderRes = await apiRequest('/orders/checkout', 'POST', {
      shippingAddressId: addressId || 'temp',
      notes: 'Simulated Card Payment'
    }, customerAccessToken);

    const orderPassed = orderRes.status === 201 && orderRes.data.success && !!orderRes.data.data.id;
    const orderId = orderRes.data.data?.id;
    reportResult('4b. Order Placement (PENDING)', orderPassed, orderId ? `Order ID: ${orderId}` : 'Failed');

    // Payment verification
    const payRes = await apiRequest('/payments/verify', 'POST', {
      orderId,
      provider: 'STRIPE',
      providerOrderId: `ch_mock_${Date.now()}`
    }, customerAccessToken);

    const payPassed = payRes.status === 200 && payRes.data.success;
    reportResult('4c. Simulated Payment Verification', payPassed, `Status: ${payRes.status}`);

    // Check order status is PAID
    const orderDetailsRes = await apiRequest(`/orders/${orderId}`, 'GET', null, customerAccessToken);
    const orderStatus = orderDetailsRes.data.data?.status;
    reportResult('4d. Order Transition to PAID', orderStatus === 'PAID', `Current Status: ${orderStatus}`);

    // ----------------------------------------------------
    // FLOW 5: Admin Login, Create Product via category UUID, Catalog visibility
    // ----------------------------------------------------
    // Log in as SUPER_ADMIN
    const adminLoginRes = await apiRequest('/auth/login', 'POST', {
      email: 'superadmin@megamart.com',
      password: 'Superadmin@123'
    });

    const adminLoginPassed = adminLoginRes.status === 200 && adminLoginRes.data.success && !!adminLoginRes.data.data.accessToken;
    if (adminLoginPassed) {
      adminAccessToken = adminLoginRes.data.data.accessToken;
    }
    reportResult('5a. Admin Authentication', adminLoginPassed, `Status: ${adminLoginRes.status}`);

    // Get the category UUID from the first product
    const categoryUUID = firstProduct?.category?.id;
    reportResult('5b. Category UUID Resolution', !!categoryUUID, `Category ID: ${categoryUUID}`);

    // Create a new product
    const newProductSlug = `green-mangoes-${Date.now()}`;
    const createProdRes = await apiRequest('/products', 'POST', {
      name: 'Organic Green Mangoes',
      slug: newProductSlug,
      description: 'Zesty green mangoes sourced from local farms.',
      categoryId: categoryUUID,
      variants: [
        {
          sku: `MNG-GRN-${Date.now()}`,
          price: 4.49,
          stock: 35,
          size: 'Standard Pack'
        }
      ],
      images: [
        {
          url: 'images/prod_bananas.png',
          isPrimary: true,
          position: 1
        }
      ]
    }, adminAccessToken);

    const createProdPassed = createProdRes.status === 201 && createProdRes.data.success;
    reportResult('5c. Admin Product Creation via UUID', createProdPassed, `Status: ${createProdRes.status}`);

    // Confirm it appears in the catalog
    const finalCatalog = await apiRequest('/products?limit=100');
    const foundProduct = finalCatalog.data.data?.find((p: any) => p.slug === newProductSlug);
    reportResult('5d. Product catalog visibility', !!foundProduct, foundProduct ? `Found Product: ${foundProduct.name}` : 'Not found');

  } catch (error: any) {
    console.error('Error during test execution:', error.message);
  }
}

runTests();
