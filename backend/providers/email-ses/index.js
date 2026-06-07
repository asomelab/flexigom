'use strict';

/**
 * Flexigom SES email provider for Strapi v5.
 * Uses AWS SDK v3 (SESv2Client) — no SMTP, direct API calls.
 *
 * Config in backend/config/plugins.ts:
 *   providerOptions: {
 *     accessKeyId:     process.env.AWS_SES_ACCESS_KEY_ID,
 *     secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
 *     region:          process.env.AWS_SES_REGION || 'us-east-1',
 *   }
 *   settings: {
 *     defaultFrom:    'no-reply@flexigomtucuman.com',
 *     defaultReplyTo: 'no-reply@flexigomtucuman.com',
 *   }
 */

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

/**
 * Normalise a string-or-array recipient field to a string[] (SES expects arrays).
 * @param {string|string[]|undefined} value
 * @returns {string[]|undefined}
 */
function toArray(value) {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

module.exports = {
  /**
   * @param {{ accessKeyId: string; secretAccessKey: string; region?: string }} providerOptions
   * @param {{ defaultFrom?: string; defaultReplyTo?: string }} settings
   */
  init(providerOptions, settings) {
    const client = new SESv2Client({
      region: providerOptions.region || 'us-east-1',
      credentials: {
        accessKeyId: providerOptions.accessKeyId,
        secretAccessKey: providerOptions.secretAccessKey,
      },
    });

    // Optional: attribute sends to a configuration set for CloudWatch reputation
    // metrics (bounce/complaint tracking). Set SES_CONFIGURATION_SET in Railway env.
    // Value comes from: cd infra/stacks/email && terraform output configuration_set_name
    const configurationSetName = providerOptions.configurationSetName || undefined;

    return {
      /**
       * Send an email.
       * Strapi passes: { from, to, cc, bcc, replyTo, subject, text, html }
       */
      async send(options) {
        const from = options.from || settings.defaultFrom;
        const replyTo = options.replyTo || settings.defaultReplyTo;

        const command = new SendEmailCommand({
          FromEmailAddress: from,
          Destination: {
            ToAddresses: toArray(options.to),
            CcAddresses: toArray(options.cc),
            BccAddresses: toArray(options.bcc),
          },
          ReplyToAddresses: replyTo ? [replyTo] : undefined,
          ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
          Content: {
            Simple: {
              Subject: { Data: options.subject || '(no subject)', Charset: 'UTF-8' },
              Body: {
                ...(options.html
                  ? { Html: { Data: options.html, Charset: 'UTF-8' } }
                  : {}),
                ...(options.text
                  ? { Text: { Data: options.text, Charset: 'UTF-8' } }
                  : {}),
              },
            },
          },
        });

        await client.send(command);
      },
    };
  },
};
