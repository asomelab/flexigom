'use strict';

/**
 * Flexigom uptime canary — triggered by EventBridge every 5 minutes.
 *
 * For each target in UPTIME_TARGETS (JSON array of {name, url, method?}):
 *   - Makes an HTTPS request; records 1 (up) or 0 (down).
 *   - Publishes a CloudWatch metric: namespace=Flexigom/Uptime, metric=SiteUp,
 *     dimension=Target:<name>.
 *
 * Uses only Node built-ins + AWS SDK v3 (bundled in Lambda Node 20 runtime).
 * No external packages needed — no bundling step required.
 */

const https = require('https');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const cw = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Send a single HTTPS request and return 1 (2xx/3xx) or 0 (error / 4xx / 5xx).
 * Times out after 10 s to keep well within the 30-s Lambda timeout.
 */
function checkUrl(url, method = 'HEAD') {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method, timeout: 10000 }, (res) => {
        res.resume(); // drain so the socket is reused
        const up = res.statusCode >= 200 && res.statusCode < 400 ? 1 : 0;
        resolve(up);
      });
      req.on('error', () => resolve(0));
      req.on('timeout', () => {
        req.destroy();
        resolve(0);
      });
      req.end();
    } catch (_) {
      resolve(0);
    }
  });
}

exports.handler = async () => {
  const targets = JSON.parse(process.env.UPTIME_TARGETS || '[]');

  if (targets.length === 0) {
    console.warn('[uptime] No targets configured — set UPTIME_TARGETS env var');
    return;
  }

  const metricData = [];

  for (const t of targets) {
    const value = await checkUrl(t.url, t.method || 'HEAD');
    const status = value === 1 ? 'UP' : 'DOWN';
    console.log(`[uptime] ${t.name} → ${status} (${t.url})`);

    metricData.push({
      MetricName: 'SiteUp',
      Dimensions: [{ Name: 'Target', Value: t.name }],
      Value: value,
      Unit: 'None',
      Timestamp: new Date(),
    });
  }

  await cw.send(new PutMetricDataCommand({
    Namespace: 'Flexigom/Uptime',
    MetricData: metricData,
  }));

  console.log(`[uptime] Published ${metricData.length} metrics to Flexigom/Uptime`);
};
