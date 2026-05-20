export default {
  routes: [
    {
      method: 'GET',
      path: '/orders/tracking/:externalReference',
      handler: 'api::order.order.getTrackingDetails',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/manual',
      handler: 'api::order.order.createManualOrder',
      config: {
        auth: false,
      },
    },
  ],
};
