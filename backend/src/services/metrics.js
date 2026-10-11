// Minimal per-process Prometheus exposition. For multi-instance installations,
// scrape each replica separately and aggregate in Prometheus.
const requestCounts = new Map();
const latencyBuckets = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, Infinity];
const histograms = new Map();
function labelsKey(method, code) { return JSON.stringify([method, String(code)]); }
function observeRequest(method, statusCode, seconds) {
  const key = labelsKey(method, statusCode);
  requestCounts.set(key, (requestCounts.get(key) || 0) + 1);
  let histogram = histograms.get(key);
  if (!histogram) { histogram = { counts: latencyBuckets.map(() => 0), sum: 0, count: 0 }; histograms.set(key, histogram); }
  histogram.count++; histogram.sum += seconds;
  latencyBuckets.forEach((bucket, i) => { if (seconds <= bucket) histogram.counts[i]++; });
}
function serialize() {
  const out = ['# HELP rapidaid_http_requests_total Completed HTTP requests', '# TYPE rapidaid_http_requests_total counter'];
  for (const [k, count] of requestCounts) {
    const [method, code] = JSON.parse(k);
    out.push(`rapidaid_http_requests_total{method="${method}",status="${code}"} ${count}`);
  }
  out.push('# HELP rapidaid_http_request_duration_seconds Request duration in seconds', '# TYPE rapidaid_http_request_duration_seconds histogram');
  for (const [k, hist] of histograms) {
    const [method, code] = JSON.parse(k);
    const prefix = `{method="${method}",status="${code}"`;
    latencyBuckets.forEach((bucket, i) => out.push(
      `rapidaid_http_request_duration_seconds_bucket${prefix},le="${bucket === Infinity ? '+Inf' : bucket}"} ${hist.counts[i]}`
    ));
    out.push(`rapidaid_http_request_duration_seconds_sum${prefix}} ${hist.sum}`);
    out.push(`rapidaid_http_request_duration_seconds_count${prefix}} ${hist.count}`);
  }
  out.push('# HELP rapidaid_process_uptime_seconds Node process uptime', '# TYPE rapidaid_process_uptime_seconds gauge', `rapidaid_process_uptime_seconds ${process.uptime()}`);
  out.push('# HELP rapidaid_process_rss_bytes Resident set size', '# TYPE rapidaid_process_rss_bytes gauge', `rapidaid_process_rss_bytes ${process.memoryUsage().rss}`);
  return out.join('\n') + '\n';
}
module.exports = { observeRequest, serialize };
