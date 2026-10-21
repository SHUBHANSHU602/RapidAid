# RapidAid local observability stack

Requires backend exposing /internal/metrics, /internal/ready, /internal/live.

1. Set a strong METRICS_TOKEN in backend environment.
2. Create infra/observability/secrets/metrics_token locally with **only** the same token (no newline). Never commit it.
3. Set GRAFANA_ADMIN_PASSWORD in your shell.
4. Start API on host port 5000, then run: docker compose -f infra/observability/docker-compose.yml up -d
5. Prometheus: http://localhost:9090 ; Grafana: http://localhost:3001
6. Confirm Prometheus target is UP and record actual time series before using dashboards.

Alert thresholds are initial operational suggestions, not validated SLAs. Alertmanager configuration and notification routing are not included. The provided stack is for local/isolated observability, not a fully hardened public deployment. Prometheus assumes Docker on Linux with host-gateway support; other environments must adjust the target. For multiple API replicas, scrape each replica separately and aggregate in Prometheus.

Suggested dashboard queries:
- Request rate: sum(rate(rapidaid_http_requests_total[5m]))
- 5xx rate: sum(rate(rapidaid_http_requests_total{status=~"5.."}[5m]))
- Request p95: histogram_quantile(0.95, sum by (le)(rate(rapidaid_http_request_duration_seconds_bucket[5m])))
- Resident memory: rapidaid_process_rss_bytes

Never use this observability stack as evidence that dispatch correctness is proven; dedicated dispatch metrics, fault injection, and load testing are still required.
