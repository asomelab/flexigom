export default {
  routes: [
    {
      method: 'GET',
      path: '/orders/tracking/:externalReference',
      handler: 'api::order.order.getTrackingDetails',
      config: {
        auth: false, // Accessible by anonymous frontend success page
      },
    },
  ],
};
