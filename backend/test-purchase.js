const { createStrapi } = require('@strapi/strapi');

async function runTest() {
  console.log('=====================================================');
  console.log('STARTING WEBHOOK PERSISTENCE SIMULATION TEST');
  console.log('=====================================================');

  // Load Strapi instance (boots the DB and loads service containers)
  const app = await createStrapi({ distDir: './dist' }).load();
  console.log('✔ Strapi booted successfully!');

  // Save original env variables to restore them later
  const originalDuxToken = process.env.DUX_API_TOKEN;
  const originalResendKey = process.env.RESEND_API_KEY;
  const originalMetaPixelId = process.env.META_PIXEL_ID;
  const originalMetaCapiToken = process.env.META_CAPI_ACCESS_TOKEN;

  // Temporarily mock environment variables to avoid calling external production APIs
  process.env.DUX_API_TOKEN = '';
  process.env.RESEND_API_KEY = '';
  process.env.META_PIXEL_ID = '';
  process.env.META_CAPI_ACCESS_TOKEN = '';

  console.log('✔ Cleaned production API tokens for testing (Dux, Resend, Meta Pixel blocked)');

  // Generate a completely unique external reference for this purchase test
  const testExternalReference = `TEST-ORDER-${Date.now()}`;
  const testPaymentId = `MP-PAYMENT-${Math.floor(Math.random() * 10000000)}`;

  const mockPaymentData = {
    external_reference: testExternalReference,
    status: 'approved',
    transaction_amount: 145500.00,
    payment_method_id: 'visa',
    payer: {
      email: 'test-buyer@example.com',
      first_name: 'Juan Pablo',
      last_name: 'Valdez Test',
      phone: {
        area_code: '381',
        number: '154123456'
      },
      identification: {
        type: 'DNI',
        number: '12345678'
      },
      address: {
        street_name: 'Av. Sarmiento',
        street_number: '1234'
      }
    },
    additional_info: {
      items: [
        {
          id: 'prod-colchon-test',
          title: 'Colchón Flexigom Foam 140x190',
          quantity: 1,
          unit_price: 145500.00,
          description: 'Medida: 140x190 | Densidad: Alta'
        }
      ]
    },
    metadata: {
      notes: 'Entregar por la tarde. Simulación de prueba de compra.'
    }
  };

  try {
    console.log(`\n--- Simulating processPaymentNotification for ${testExternalReference} ---`);
    
    // Call the newly refactored service method
    const result = await global.strapi
      .service('api::mercadopago.mercadopago')
      .processPaymentNotification(testPaymentId, mockPaymentData);

    if (!result) {
      throw new Error('processPaymentNotification returned null/undefined!');
    }

    console.log('\n✔ Webhook processing completed successfully without throwing any errors!');
    console.log('-----------------------------------------------------');
    console.log('VERIFYING DATABASE PERSISTENCE USING STRAPI 5 DOCUMENT SERVICE');
    console.log('-----------------------------------------------------');

    // Query the database directly via Strapi 5 document service to verify persistence
    const savedOrders = await global.strapi.documents('api::order.order').findMany({
      filters: { external_reference: testExternalReference },
      limit: 1,
    });

    if (savedOrders && savedOrders.length > 0) {
      const order = savedOrders[0];
      console.log('✔ Order was SUCCESSFULLY found and loaded from database!');
      console.log('\n--- Saved Order Details ---');
      console.log(`  - Database ID (numeric): ${order.id}`);
      console.log(`  - Alphanumeric DocumentID: ${order.documentId}`);
      console.log(`  - External Reference: ${order.external_reference}`);
      console.log(`  - Payment ID: ${order.payment_id}`);
      console.log(`  - Payment Status: ${order.payment_status}`);
      console.log(`  - Customer Name: ${order.customer_name}`);
      console.log(`  - Customer Email: ${order.customer_email}`);
      console.log(`  - Transaction Amount: $${order.transaction_amount}`);
      console.log(`  - Items Count: ${Array.isArray(order.items) ? order.items.length : 0}`);
      console.log(`  - Webhook Notification Logged Count: ${Array.isArray(order.webhook_notifications) ? order.webhook_notifications.length : 0}`);
      console.log('-----------------------------------------------------');
      console.log('TEST RESULT: SUCCESS! The Order Collection Type successfully registers purchases!');
    } else {
      console.error('❌ TEST FAILED: Order was not found in the database for the given external reference!');
    }
  } catch (err) {
    console.error('❌ TEST FAILED with error during execution:');
    console.error(err);
  } finally {
    // Restore environment variables
    process.env.DUX_API_TOKEN = originalDuxToken;
    process.env.RESEND_API_KEY = originalResendKey;
    process.env.META_PIXEL_ID = originalMetaPixelId;
    process.env.META_CAPI_ACCESS_TOKEN = originalMetaCapiToken;

    console.log('\n✔ Restored original production environment tokens.');
    console.log('Closing Strapi...');
    await app.destroy();
    console.log('Strapi process closed. Test execution finished.');
    console.log('=====================================================');
  }
}

runTest();
