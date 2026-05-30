export default {
  routes: [
    {
      method: "POST",
      path: "/mercadopago/create-preference",
      handler: "mercadopago.createPreference",
      config: {
        policies: [],
        middlewares: ["api::mercadopago.create-preference-rate-limit"],
      },
    },
    {
      method: "POST",
      path: "/mercadopago/webhook",
      handler: "webhook.handleWebhook",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
