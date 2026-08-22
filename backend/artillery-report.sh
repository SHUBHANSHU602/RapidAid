#!/bin/bash
echo "Running RapidAid load test..."
artillery run artillery.config.yml --output artillery-report.json
artillery report artillery-report.json --output artillery-report.html
echo "Report generated: artillery-report.html"
