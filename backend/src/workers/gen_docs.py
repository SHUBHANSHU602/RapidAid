
# Generate RapidAid Complete Documentation HTML
import os

output_path = r'C:\Users\SHUBHANSHU\.gemini\antigravity-ide\brain\6e303dd8-7a30-48af-8877-1317d7e31b2e\rapidaid_complete_docs.html'

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>RapidAid — Complete Project Documentation 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--red:#EF4444;--blue:#3B82F6;--green:#22C55E;--amber:#F59E0B;--purple:#A855F7;--cyan:#06B6D4;--bg:#0F1117;--surface:#1A1D2E;--border:#2A2D3E;--text:#E2E8F0;--muted:#94A3B8}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.7;font-size:14px}
@media print{
  body{background:#fff;color:#111;font-size:11pt}
  .page-break{page-break-before:always}
  .no-break{page-break-inside:avoid}
  .cover{min-height:100vh}
  a{color:inherit;text-decoration:none}
  pre,code{background:#f4f4f4!important;color:#111!important;border:1px solid #ddd!important}
  .tag{border:1px solid #ccc!important}
  table{border-collapse:collapse}
  td,th{border:1px solid #ccc}
}
.cover{min-height:100vh;background:linear-gradient(135deg,#0F1117 0%,#1a0808 40%,#0F1117 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 40px;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;top:-200px;left:-200px;width:600px;height:600px;background:radial-gradient(circle,rgba(239,68,68,.15) 0%,transparent 70%);border-radius:50%}
.cover::after{content:'';position:absolute;bottom:-200px;right:-200px;width:500px;height:500px;background:radial-gradient(circle,rgba(59,130,246,.1) 0%,transparent 70%);border-radius:50%}
.cover-inner{position:relative;z-index:1;max-width:820px}
.logo-box{width:84px;height:84px;background:var(--red);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 32px;box-shadow:0 0 60px rgba(239,68,68,.4)}
.cover h1{font-size:58px;font-weight:900;letter-spacing:-2px;line-height:1.1;margin-bottom:16px}
.cover h1 span{color:var(--red)}
.cover .subtitle{font-size:22px;font-weight:300;color:var(--muted);margin-bottom:12px}
.cover .author{font-size:15px;color:var(--muted);margin-bottom:40px}
.cover .quote{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-left:4px solid var(--red);border-radius:12px;padding:20px 24px;font-style:italic;color:var(--muted);font-size:15px;margin-bottom:40px;text-align:left}
.stats-row{display:flex;gap:24px;justify-content:center;flex-wrap:wrap}
.stat-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 20px;text-align:center;min-width:110px}
.stat-box .num{font-size:22px;font-weight:800;color:var(--red)}
.stat-box .lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.tags{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:32px}
.tag{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red);border-radius:100px;padding:4px 14px;font-size:12px;font-weight:600}
.tag.blue{background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.3);color:#60A5FA}
.tag.green{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#4ADE80}
.tag.purple{background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.3);color:#C084FC}
.tag.amber{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:#FCD34D}
.section{max-width:920px;margin:0 auto;padding:60px 40px}
.section-header{display:flex;align-items:center;gap:16px;margin-bottom:40px;padding-bottom:20px;border-bottom:1px solid var(--border)}
.section-num{width:48px;height:48px;background:var(--red);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;flex-shrink:0}
.section-header h2{font-size:32px;font-weight:800}
.section-header .sub{font-size:15px;color:var(--muted);margin-top:4px}
h3{font-size:20px;font-weight:700;margin:32px 0 12px;color:var(--text)}
h4{font-size:14px;font-weight:700;margin:20px 0 8px;color:var(--muted);text-transform:uppercase;letter-spacing:1px}
p{color:var(--muted);margin-bottom:14px}
strong{color:var(--text)}
ul,ol{padding-left:24px;margin-bottom:14px}
li{color:var(--muted);margin-bottom:6px}
li strong{color:var(--text)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:20px}
.card.red{border-color:rgba(239,68,68,.3)}
.card.blue{border-color:rgba(59,130,246,.3)}
.card.green{border-color:rgba(34,197,94,.3)}
.card.purple{border-color:rgba(168,85,247,.3)}
.card.amber{border-color:rgba(245,158,11,.3)}
.card h3{margin-top:0}
pre{background:#0D0F1A;border:1px solid var(--border);border-radius:12px;padding:20px;overflow-x:auto;margin-bottom:20px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;color:#CBD5E1;white-space:pre-wrap;word-wrap:break-word}
code{font-family:'JetBrains Mono',monospace;background:rgba(255,255,255,.06);padding:2px 8px;border-radius:6px;font-size:12px;color:#F472B6}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
thead{background:rgba(255,255,255,.04)}
th{text-align:left;padding:12px 16px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;border-bottom:1px solid var(--border)}
td{padding:12px 16px;color:var(--muted);border-bottom:1px solid rgba(255,255,255,.04);vertical-align:top}
td strong{color:var(--text)}
tr:last-child td{border-bottom:none}
.callout{border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:12px}
.callout.note{background:rgba(59,130,246,.08);border-left:4px solid var(--blue)}
.callout.warn{background:rgba(245,158,11,.08);border-left:4px solid var(--amber)}
.callout.crit{background:rgba(239,68,68,.08);border-left:4px solid var(--red)}
.callout.good{background:rgba(34,197,94,.08);border-left:4px solid var(--green)}
.callout .icon{font-size:18px;flex-shrink:0;margin-top:2px}
.callout-body{flex:1}
.callout-body strong{display:block;margin-bottom:4px;color:var(--text)}
.callout-body p{margin:0;font-size:13px}
.flow{background:#0D0F1A;border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px}
.flow-step{display:flex;align-items:flex-start;gap:16px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.flow-step:last-child{border-bottom:none}
.flow-dot{width:32px;height:32px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;color:#fff}
.flow-dot.blue{background:var(--blue)}
.flow-dot.green{background:var(--green)}
.flow-dot.amber{background:var(--amber)}
.flow-dot.purple{background:var(--purple)}
.flow-content h5{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px}
.flow-content p{font-size:13px;margin:0}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.metric{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center}
.metric .val{font-size:26px;font-weight:800;color:var(--red)}
.metric .lbl{font-size:12px;color:var(--muted);margin-top:4px}
hr{border:none;border-top:1px solid var(--border);margin:32px 0}
.toc{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px}
.toc h3{margin-top:0;margin-bottom:24px;color:var(--red)}
.toc-item{display:flex;align-items:flex-start;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.toc-item:last-child{border-bottom:none}
.toc-num{width:28px;height:28px;min-width:28px;background:rgba(239,68,68,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--red)}
.toc-title{font-weight:600;color:var(--text)}
.toc-sub{font-size:12px;color:var(--muted);margin-top:2px}
.level{display:inline-flex;align-items:center;gap:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:var(--red);margin-bottom:12px}
.level.l2{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:var(--amber)}
.level.l3{background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.3);color:var(--purple)}
.level.l4{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:var(--green)}
.ai-service{background:rgba(168,85,247,.05);border:1px solid rgba(168,85,247,.2);border-radius:12px;padding:20px;margin-bottom:16px}
.ai-service h4{color:#C084FC;margin-top:0;text-transform:none;letter-spacing:0;font-size:15px}
.temp-badge{display:inline-block;background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.3);border-radius:100px;padding:2px 10px;font-size:11px;font-weight:700;color:#C084FC;margin-left:8px}
.screen-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:24px}
.screen-header{background:rgba(255,255,255,.04);padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.screen-dots{display:flex;gap:6px}
.screen-dot{width:10px;height:10px;border-radius:50%}
.screen-dot:nth-child(1){background:#FF5F57}
.screen-dot:nth-child(2){background:#FEBC2E}
.screen-dot:nth-child(3){background:#28C840}
.screen-title{font-size:13px;color:var(--muted);font-weight:500}
.screen-body{padding:24px}
.screen-body p:last-child{margin-bottom:0}
.doc-footer{background:var(--surface);border-top:1px solid var(--border);padding:32px 40px;text-align:center;color:var(--muted);font-size:13px}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-inner">
    <div class="logo-box">&#x1F691;</div>
    <h1>Rapid<span>Aid</span></h1>
    <p class="subtitle">AI-Powered Emergency Ambulance Dispatch System</p>
    <p class="author">Shubhanshu Singh &middot; B.Tech CSE (AI/ML) &middot; NITRA Technical Campus &middot; 2026</p>
    <div class="quote">"A production-grade real-time emergency dispatch system. Assigns the nearest ambulance in under 300ms. Tracks it live via WebSockets. Detects delays before the patient notices. Uses LLaMA 3 to generate context-aware first-aid and fallback instructions &mdash; deployed on a fully integrated full-stack with React/Vite, Node.js/Socket.io, Redis, MongoDB, and BullMQ."</div>
    <div class="tags">
      <span class="tag">React 19</span>
      <span class="tag blue">Vite 8</span>
      <span class="tag">Node.js</span>
      <span class="tag blue">Socket.io</span>
      <span class="tag green">MongoDB Atlas</span>
      <span class="tag amber">Redis/Upstash</span>
      <span class="tag purple">Groq LLaMA 3</span>
      <span class="tag">BullMQ</span>
      <span class="tag blue">JWT</span>
      <span class="tag green">Leaflet Maps</span>
      <span class="tag purple">Zustand</span>
      <span class="tag amber">Framer Motion</span>
    </div>
    <div class="stats-row">
      <div class="stat-box"><div class="num">&lt;300ms</div><div class="lbl">Assignment</div></div>
      <div class="stat-box"><div class="num">4s</div><div class="lbl">GPS Update</div></div>
      <div class="stat-box"><div class="num">4-Level</div><div class="lbl">Fallback</div></div>
      <div class="stat-box"><div class="num">6</div><div class="lbl">AI Services</div></div>
      <div class="stat-box"><div class="num">14</div><div class="lbl">Emg. Types</div></div>
      <div class="stat-box"><div class="num">60s</div><div class="lbl">Delay Check</div></div>
    </div>
  </div>
</div>

<!-- TOC -->
<div class="section page-break">
  <div class="toc">
    <h3>&#x1F4CB; Table of Contents</h3>
    <div class="toc-item"><div class="toc-num">01</div><div><div class="toc-title">The Problem &amp; Solution</div><div class="toc-sub">India's emergency response gap &middot; What RapidAid solves &middot; Real-world impact</div></div></div>
    <div class="toc-item"><div class="toc-num">02</div><div><div class="toc-title">System Architecture</div><div class="toc-sub">Full-stack design &middot; Technology layer map &middot; Complete emergency trigger flow</div></div></div>
    <div class="toc-item"><div class="toc-num">03</div><div><div class="toc-title">Tech Stack &mdash; Why Each Choice</div><div class="toc-sub">React+Vite &middot; Node.js &middot; Socket.io &middot; MongoDB &middot; Redis &middot; BullMQ &middot; Groq &middot; Leaflet</div></div></div>
    <div class="toc-item"><div class="toc-num">04</div><div><div class="toc-title">Data Models &amp; State Machine</div><div class="toc-sub">EmergencySession schema &middot; Redis key schema &middot; 6-state machine &middot; Event sourcing</div></div></div>
    <div class="toc-item"><div class="toc-num">05</div><div><div class="toc-title">Assignment Algorithm</div><div class="toc-sub">Phase 1 geohash &middot; Phase 2 scoring &middot; Geo-partition filter &middot; Promise.all &middot; Score collapse fix</div></div></div>
    <div class="toc-item"><div class="toc-num">06</div><div><div class="toc-title">Real-Time Layer</div><div class="toc-sub">Socket.io rooms &middot; JWT middleware &middot; GPS delta compression &middot; ETA loop &middot; 15 events</div></div></div>
    <div class="toc-item"><div class="toc-num">07</div><div><div class="toc-title">Delay Detection &amp; Fallback Chain</div><div class="toc-sub">BullMQ worker &middot; Drift detection &middot; 4-level fallback &middot; Threshold engineering</div></div></div>
    <div class="toc-item"><div class="toc-num">08</div><div><div class="toc-title">AI Layer &mdash; 6 Services</div><div class="toc-sub">General First Aid &middot; Triage &middot; Hospital &middot; Specialised First Aid &middot; Delay Message &middot; Driver Assist</div></div></div>
    <div class="toc-item"><div class="toc-num">09</div><div><div class="toc-title">Frontend &mdash; Complete Explanation</div><div class="toc-sub">Landing &middot; Auth &middot; Patient Dashboard &middot; TriggerModal &middot; Emergency Tracking &middot; Driver Dashboard</div></div></div>
    <div class="toc-item"><div class="toc-num">10</div><div><div class="toc-title">Security &amp; Authentication</div><div class="toc-sub">Two-token JWT &middot; Ownership auth &middot; Enumeration prevention &middot; Defense-in-depth table</div></div></div>
    <div class="toc-item"><div class="toc-num">11</div><div><div class="toc-title">Performance &amp; Scalability</div><div class="toc-sub">9 measured metrics &middot; 6 key optimizations &middot; Horizontal scaling &middot; Graceful degradation</div></div></div>
    <div class="toc-item"><div class="toc-num">12</div><div><div class="toc-title">Real-World Implementation</div><div class="toc-sub">Deployment roadmap &middot; System integrations &middot; HIPAA &middot; City-scale design</div></div></div>
    <div class="toc-item"><div class="toc-num">13</div><div><div class="toc-title">Engineering Decisions</div><div class="toc-sub">10 non-obvious decisions with complete rationale and production context</div></div></div>
  </div>
</div>

<!-- 01 PROBLEM -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">01</div>
    <div><h2>The Problem &amp; Solution</h2><div class="sub">India's emergency response gap and how RapidAid addresses every failure point</div></div>
  </div>
  <div class="card red">
    <h3>&#x1F6A8; The Problem &mdash; India's Emergency Response Gap</h3>
    <p>In India, approximately <strong>50% of accident victims die not from the injury itself, but from delayed medical response.</strong> The gap between when an emergency happens and when help arrives is where lives are lost. Three systemic failures drive this:</p>
    <div class="grid-3" style="margin-top:16px">
      <div style="text-align:center;padding:16px;background:rgba(239,68,68,.05);border-radius:10px">
        <div style="font-size:26px;font-weight:800;color:var(--red)">&#x274C;</div>
        <div style="font-weight:700;color:var(--text);margin:8px 0 4px">No Real-Time Tracking</div>
        <div style="font-size:12px;color:var(--muted)">Patients have zero visibility into where the ambulance is or if it is even moving.</div>
      </div>
      <div style="text-align:center;padding:16px;background:rgba(239,68,68,.05);border-radius:10px">
        <div style="font-size:26px;font-weight:800;color:var(--red)">&#x274C;</div>
        <div style="font-weight:700;color:var(--text);margin:8px 0 4px">Manual Assignment</div>
        <div style="font-size:12px;color:var(--muted)">Nearest ambulance not guaranteed &mdash; first-come-first-served ignores proximity and traffic.</div>
      </div>
      <div style="text-align:center;padding:16px;background:rgba(239,68,68,.05);border-radius:10px">
        <div style="font-size:26px;font-weight:800;color:var(--red)">&#x274C;</div>
        <div style="font-weight:700;color:var(--text);margin:8px 0 4px">No Fallback Logic</div>
        <div style="font-size:12px;color:var(--muted)">When an ambulance is delayed, the system has no next action. The patient waits.</div>
      </div>
    </div>
  </div>
  <div class="card green">
    <h3>&#x2705; RapidAid &mdash; What We Solve</h3>
    <p>RapidAid addresses all three failure points simultaneously with a production-grade system that acts proactively rather than reactively.</p>
    <ul>
      <li><strong>Sub-300ms Assignment &mdash;</strong> The nearest available ambulance is dispatched using Redis O(1) reads + geohash proximity + weighted scoring. Fully algorithmic, no human dispatcher.</li>
      <li><strong>Live GPS Tracking &mdash;</strong> Patient sees the ambulance moving in real time on a dark-mode interactive map. Updates every 4 seconds via WebSocket rooms. 10m delta compression eliminates noise.</li>
      <li><strong>Dual First Aid System &mdash;</strong> Instant hardcoded general first aid for all 14 emergency types (always available, zero latency) + AI-generated specialised first aid via LLaMA 3 for severity 4-5 (within 1 second).</li>
      <li><strong>Proactive Delay Detection &mdash;</strong> BullMQ background worker checks ETA drift every 60 seconds and triggers a 4-level fallback chain automatically, before the patient notices any delay.</li>
      <li><strong>6 AI Services &mdash;</strong> Triage, hospital selection, specialised first aid, delay messaging, general first aid (hardcoded), and driver quick-replies. Every service backed by a hardcoded fallback so AI is never a single point of failure.</li>
      <li><strong>Smart Hospital Selection &mdash;</strong> LLaMA 3 ranks nearby hospitals by proximity, available beds, and specializations before ambulance dispatch. Patient knows destination immediately.</li>
    </ul>
  </div>
  <h3>&#x23F1; Why 300ms?</h3>
  <div class="callout crit">
    <div class="icon">&#x26A0;&#xFE0F;</div>
    <div class="callout-body">
      <strong>This is not an arbitrary target.</strong>
      <p>In cardiac arrest, brain death begins in 4-6 minutes without CPR. Every second of dispatch delay is a second taken from the response window. 300ms is achievable with Redis O(1) reads and is fast enough that assignment completes before the patient finishes reading the confirmation screen.</p>
    </div>
  </div>
  <h3>&#x1F30D; Real-World Impact</h3>
  <div class="grid-2">
    <div class="card">
      <h4>Clinical Impact</h4>
      <ul>
        <li>Faster dispatch = higher survival in cardiac, stroke, and trauma</li>
        <li>AI triage catches severity misclassification before dispatch</li>
        <li>Specialised first aid in &lt;1 second of session creation</li>
        <li>Hospital pre-notified when ambulance delayed (Level 4 webhook)</li>
        <li>OTP arrival verification prevents impersonation</li>
      </ul>
    </div>
    <div class="card">
      <h4>Operational Impact</h4>
      <ul>
        <li>Eliminates manual dispatcher role entirely</li>
        <li>Ambulance swapping reduces wasted response time</li>
        <li>Full eventLog audit trail enables analytics and accountability</li>
        <li>ML training data generated from every session for delay prediction</li>
        <li>City dashboard: real-time session map for command centers</li>
      </ul>
    </div>
  </div>
</div>

<!-- 02 ARCHITECTURE -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">02</div>
    <div><h2>System Architecture</h2><div class="sub">Stateless, horizontally scalable, event-driven full-stack design</div></div>
  </div>
  <div class="callout note">
    <div class="icon">&#x1F4A1;</div>
    <div class="callout-body">
      <strong>Core Design Principle</strong>
      <p>No session state lives in Node.js memory. All shared state (ambulance availability, GPS, ETA, job queues) lives in Redis. This makes the backend horizontally scalable &mdash; any server instance handles any request without sticky routing.</p>
    </div>
  </div>
  <h3>Technology Layer Map</h3>
  <table>
    <thead><tr><th>Layer</th><th>Technology</th><th>Responsibility</th></tr></thead>
    <tbody>
      <tr><td><strong>Client &mdash; Patient</strong></td><td>React 19 + Vite 8 + Tailwind v4</td><td>SOS trigger, live tracking map, first aid cards, OTP, chat</td></tr>
      <tr><td><strong>Client &mdash; Driver</strong></td><td>React 19 + Vite 8</td><td>Online toggle, GPS emitter, assignment display</td></tr>
      <tr><td><strong>API Gateway</strong></td><td>Express 5 + Helmet + rate-limit</td><td>REST endpoints, rate limiting, CORS, security headers</td></tr>
      <tr><td><strong>Real-Time</strong></td><td>Socket.io 4.x</td><td>WebSocket rooms, JWT middleware, 15 socket events</td></tr>
      <tr><td><strong>Business Logic</strong></td><td>Node.js services</td><td>Assignment, fallback, AI orchestration, ambulance cache</td></tr>
      <tr><td><strong>Job Queue</strong></td><td>BullMQ + Redis</td><td>Delay detection worker (60s), maps queue worker</td></tr>
      <tr><td><strong>Primary DB</strong></td><td>MongoDB Atlas (Mongoose 9)</td><td>Sessions, users, ambulances, hospitals, eventLog</td></tr>
      <tr><td><strong>State Cache</strong></td><td>Redis via Upstash (ioredis)</td><td>Ambulance Set, GPS with TTL, ETA with TTL</td></tr>
      <tr><td><strong>AI Engine</strong></td><td>Groq API (LLaMA 3 8B)</td><td>Triage, hospital, first aid, delay message, driver assist</td></tr>
      <tr><td><strong>Maps</strong></td><td>Google Maps API + Haversine fallback</td><td>Real ETAs with live traffic, distance scoring</td></tr>
      <tr><td><strong>Deployment</strong></td><td>Railway + Vercel + Upstash + MongoDB Atlas</td><td>Fully managed cloud production hosting</td></tr>
    </tbody>
  </table>
  <h3>Emergency Trigger &mdash; Full Request Flow</h3>
  <div class="flow">
    <div class="flow-step"><div class="flow-dot">1</div><div class="flow-content"><h5>Patient taps SOS &rarr; TriggerModal opens</h5><p>Patient selects emergency type (14 options), severity (1-5 visual buttons), optional natural language description. useGeolocation hook acquires GPS in background.</p></div></div>
    <div class="flow-step"><div class="flow-dot">2</div><div class="flow-content"><h5>POST /api/v1/emergency/trigger</h5><p>JWT verified &rarr; express-validator validates body &rarr; session created in MongoDB with status: INITIATED. Session _id returned immediately to client.</p></div></div>
    <div class="flow-step"><div class="flow-dot blue">3</div><div class="flow-content"><h5>AI Triage + Hospital + First Aid fires in parallel (fire-and-forget)</h5><p>triageService analyses description &rarr; severity override on high confidence. hospitalService pre-selects top hospital. generalFirstAidService returns hardcoded first aid instantly (zero latency). firstAidService (AI) generates specialised steps for severity 4-5.</p></div></div>
    <div class="flow-step"><div class="flow-dot">4</div><div class="flow-content"><h5>Client navigates to /emergency/:id &rarr; joins Socket.io room session:{id}</h5><p>500ms grace period (setTimeout) before assignment algorithm fires &mdash; ensures client is in the room before ambulance_assigned event is emitted. Race condition fix.</p></div></div>
    <div class="flow-step"><div class="flow-dot green">5</div><div class="flow-content"><h5>Assignment Algorithm executes (&lt;300ms)</h5><p>Phase 1: Redis geohash prefix match + 8 neighbours &rarr; candidates. Geo-partition zone filter. Phase 2: Maps API batch ETA &rarr; weighted scoring &rarr; winner. Promise.all writes Redis + MongoDB simultaneously.</p></div></div>
    <div class="flow-step"><div class="flow-dot amber">6</div><div class="flow-content"><h5>Socket.io emits ambulance_assigned to session:{id} room</h5><p>Patient UI receives: driver name, vehicle number, contact, ETA. Map auto-fits bounds to show both markers. ETA progress bar initialises.</p></div></div>
    <div class="flow-step"><div class="flow-dot purple">7</div><div class="flow-content"><h5>BullMQ schedules delay detection (60s repeating job)</h5><p>jobId: delay:{sessionId} &mdash; idempotent, no duplicates. Job persists in Redis and survives server restarts, deploys, crashes. concurrency: 5.</p></div></div>
    <div class="flow-step"><div class="flow-dot blue">8</div><div class="flow-content"><h5>Driver joins room &rarr; GPS + ETA loop begins</h5><p>LocationEmitter in driver frontend emits GPS every 4 seconds. Server applies 10m delta compression. ETA recalculated every 30 seconds. BullMQ detects drift &gt;3min &rarr; fallback chain.</p></div></div>
  </div>
</div>

<!-- 03 TECH STACK -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">03</div>
    <div><h2>Tech Stack &mdash; Why Each Choice</h2><div class="sub">Every technology selected for a specific, measurable reason</div></div>
  </div>
  <div class="grid-2">
    <div class="card blue">
      <h3>&#x269B;&#xFE0F; React 19 + Vite 8</h3>
      <p><strong>Why:</strong> Vite's native ES module dev server eliminates Webpack bundling &mdash; cold starts in &lt;100ms vs 3-5 seconds. React 19 concurrent rendering ensures the live map and rapid socket event handlers don't block the UI thread during GPS updates at 4-second intervals.</p>
      <p><strong>Usage:</strong> Zustand for global state (authStore, sessionStore, driverStore), React Router v7 for role-based navigation (ProtectedRoute + RoleRoute), Framer Motion for landing page animations, react-leaflet for the interactive tracking map.</p>
    </div>
    <div class="card">
      <h3>&#x1F7E2; Node.js + Express 5</h3>
      <p><strong>Why:</strong> Non-blocking I/O handles thousands of concurrent WebSocket connections alongside REST requests without thread-switching overhead. Java/Spring or Python/Flask would require heavy thread pools for this I/O-heavy, concurrency-heavy workload.</p>
      <p><strong>Usage:</strong> express-validator for schema validation on all bodies, express-rate-limit per route (100/15min/IP on all, stricter on auth), helmet for 15+ security headers, Winston with UUID requestId for structured logging.</p>
    </div>
    <div class="card blue">
      <h3>&#x1F50C; Socket.io 4.x</h3>
      <p><strong>Why:</strong> HTTP polling adds 100-500ms latency per update and hammers the server with requests. Socket.io provides persistent bidirectional channels with rooms, JWT middleware, automatic reconnection with exponential backoff, and namespace support on top of raw WebSockets.</p>
      <p><strong>Usage:</strong> One room per session (session:{id}), JWT auth in io.use() middleware, 15 distinct socket events, GPS + ETA + delay + chat all scoped to session room. @socket.io/redis-adapter installed for future horizontal scaling.</p>
    </div>
    <div class="card green">
      <h3>&#x1F343; MongoDB Atlas (Mongoose 9)</h3>
      <p><strong>Why:</strong> Emergency sessions have flexible, nested structure &mdash; growing eventLog array, GeoJSON coordinates, populated references to ambulances and hospitals. A relational schema needs 4+ joins per session read. MongoDB retrieves the full session in one query.</p>
      <p><strong>Usage:</strong> 2dsphere index on Ambulance.currentLocation, soft delete (isActive: false) on hospitals for HIPAA-style retention, .lean() for read-only queries (2-3x faster than Mongoose documents), instance method addEvent() for atomic eventLog append.</p>
    </div>
    <div class="card amber">
      <h3>&#x26A1; Redis via Upstash (ioredis)</h3>
      <p><strong>Why:</strong> Ambulance availability is read on every assignment and every 4-second GPS ping. MongoDB adds 10-50ms RTT per read. Redis delivers sub-millisecond reads from memory. Rule: MongoDB for history and complex queries. Redis for current state that must be read in microseconds.</p>
      <p><strong>Usage:</strong> ambulance:available Set (O(1) SMEMBERS + SADD/SREM), ambulance:{id}:status/location/zone keys, session:{id}:eta with 90s TTL, ioredis pipeline batching (20 ambulances in 1 round trip on boot), SCAN instead of KEYS.</p>
    </div>
    <div class="card purple">
      <h3>&#x1F3AF; BullMQ</h3>
      <p><strong>Why:</strong> setInterval lives in Node.js memory &mdash; any server restart, deploy, or crash silently kills all active delay monitors. Every session loses monitoring with no error. BullMQ persists jobs in Redis, survives restarts, and prevents duplicate workers via jobId idempotency.</p>
      <p><strong>Usage:</strong> Repeating 60s jobs per active session, concurrency: 5, throw err in processor (not silent catch) &mdash; BullMQ marks job failed and triggers retry. Auto-cancel on RESOLVED/CANCELLED. QueueEvents for monitoring job failures.</p>
    </div>
    <div class="card red">
      <h3>&#x1F916; Groq API (LLaMA 3 8B)</h3>
      <p><strong>Why:</strong> Standard OpenAI/Anthropic APIs run 1-5 seconds per call. In an emergency system, 5 seconds is clinically significant &mdash; it blocks dispatch. Groq delivers LLaMA 3 via hardware-accelerated inference in &lt;300ms, matching our ambulance assignment SLA.</p>
      <p><strong>Usage:</strong> 6 services (temp 0.2-0.5), Bottleneck rate limiter (25 req/min token bucket, min 2s between requests), exponential backoff on 429 (1s&rarr;2s&rarr;4s&rarr;throw), hardcoded fallback in every service. Groq unavailable never breaks dispatch.</p>
    </div>
    <div class="card">
      <h3>&#x1F5FA;&#xFE0F; Leaflet + react-leaflet</h3>
      <p><strong>Why:</strong> Google Maps JS API costs $7 per 1,000 map loads. Leaflet is open-source and free at any scale. CartoDB dark tile layer matches the app's dark glassmorphism aesthetic perfectly. react-leaflet provides React wrappers for animated marker updates and bounds fitting.</p>
      <p><strong>Usage:</strong> Dark CartoDB tile layer (https://basemaps.cartocdn.com/dark_all), custom DivIcon for patient (pulsing red CSS dot) and ambulance (emoji), MapRecenter component auto-fits bounds to show both markers, flyTo animation for initial patient-only view.</p>
    </div>
  </div>
  <h3>Frontend State Management &mdash; Zustand Stores</h3>
  <table>
    <thead><tr><th>Store</th><th>State</th><th>Key Actions</th></tr></thead>
    <tbody>
      <tr><td><strong>authStore.js</strong></td><td>user, accessToken, isAuthenticated</td><td>login, logout, loadUser, register &mdash; persists token to localStorage</td></tr>
      <tr><td><strong>sessionStore.js</strong></td><td>sessions[], activeSession, isLoading</td><td>loadSessions, loadSession, triggerEmergency, updateActiveSession, clearActiveSession</td></tr>
      <tr><td><strong>driverStore.js</strong></td><td>isOnline, assignment</td><td>toggleOnline, setAssignment &mdash; drives LocationEmitter active state</td></tr>
    </tbody>
  </table>
</div>

<!-- 04 DATA MODELS -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">04</div>
    <div><h2>Data Models &amp; State Machine</h2><div class="sub">Event sourcing via eventLog &middot; 6-state lifecycle &middot; Redis key schema</div></div>
  </div>
  <h3>EmergencySession &mdash; The Core Document</h3>
  <pre>EmergencySession {
  userId:          ObjectId -&gt; User
  location:        { lat: Number, lng: Number }      // Patient GPS at trigger time
  emergencyType:   Enum [ CARDIAC, ACCIDENT, STROKE, FIRE, SNAKE_BITE,
                          BREATHING, HEAD_INJURY, BURNS, POISONING,
                          PREGNANCY, TRAUMA, RESPIRATORY, NEUROLOGICAL, OTHER ]
  severityLevel:   Number 1-5  (set by AI triage override or user input)
  description:     String       (optional - fed to AI for triage + specialised first aid)
  ambulanceId:     ObjectId -&gt; Ambulance (set on assignment)
  hospitalId:      ObjectId -&gt; Hospital  (set on AI hospital selection)
  hospitalRanking: Array         (AI-ranked hospitals with reasoning)
  generalFirstAid: Object        (hardcoded, always present from trigger)
  status:          Enum [ INITIATED, ASSIGNED, EN_ROUTE, DELAYED, RESOLVED, CANCELLED ]
  resolvedAt:      Date          (set when RESOLVED)
  eventLog:        [{ status: String, timestamp: Date, meta: Object }]

  Instance method: addEvent(status, meta)
    -&gt; pushes { status, timestamp: Date.now(), meta } to eventLog array
    -&gt; caller must call session.save() after (Unit of Work pattern)
}</pre>
  <div class="callout note">
    <div class="icon">&#x1F4DA;</div>
    <div class="callout-body">
      <strong>Why Event Sourcing via eventLog?</strong>
      <p>Storing only the current status tells you where you are. The eventLog tells you everything that happened: when assigned, when delayed, what the drift was, which fallback level ran, when rerouted, what the AI generated. This enables production debugging, city analytics dashboards, and ML training data for future delay prediction models.</p>
    </div>
  </div>
  <h3>Session State Machine</h3>
  <pre>INITIATED  --[assignment runs]----------&gt; ASSIGNED
ASSIGNED   --[driver confirms]-----------&gt; EN_ROUTE
           --[user cancels]-------------&gt; CANCELLED
EN_ROUTE   --[BullMQ drift &gt;3min]-------&gt; DELAYED
           --[driver confirms arrival]--&gt; RESOLVED
DELAYED    --[fallback L1/L2 succeeds]--&gt; EN_ROUTE
           --[driver arrives]-----------&gt; RESOLVED
           --[user cancels]-------------&gt; CANCELLED

Every transition:
  - Validated server-side against whitelist (invalid -&gt; 400 with allowed states)
  - Appended to eventLog with timestamp + metadata
  - Broadcast to session room via session_status_changed socket event</pre>
  <div class="callout warn">
    <div class="icon">&#x26A0;&#xFE0F;</div>
    <div class="callout-body">
      <strong>Why enforce transitions server-side?</strong>
      <p>A client sending <code>{"status":"RESOLVED"}</code> when session is INITIATED would corrupt the lifecycle. The server validates every transition against a whitelist. This is the same pattern used in payment systems and order management pipelines. An invalid transition returns 400 with the list of allowed next states.</p>
    </div>
  </div>
  <h3>Redis Key Schema</h3>
  <table>
    <thead><tr><th>Key</th><th>Value</th><th>TTL</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>ambulance:available</code></td><td>Redis Set of ambulance IDs</td><td>None</td><td>O(1) SMEMBERS during assignment candidate generation</td></tr>
      <tr><td><code>ambulance:{id}:status</code></td><td>"AVAILABLE" | "BUSY" | "OFFLINE"</td><td>None</td><td>Current availability without MongoDB query</td></tr>
      <tr><td><code>ambulance:{id}:location</code></td><td>{lat, lng, geohash, timestamp}</td><td>300s</td><td>Last GPS ping &mdash; expires if driver disconnects and stays away</td></tr>
      <tr><td><code>ambulance:{id}:zone</code></td><td>4-char geohash zone</td><td>None</td><td>Geo-partition pre-filter before Phase 2 scoring</td></tr>
      <tr><td><code>session:{id}:eta</code></td><td>{etaMinutes, calculatedAt}</td><td>90s</td><td>Latest ETA &mdash; 3 full update cycles of buffer before expiry</td></tr>
    </tbody>
  </table>
  <h3>MongoDB Models Summary</h3>
  <table>
    <thead><tr><th>Model</th><th>Key Fields</th><th>Indexes</th></tr></thead>
    <tbody>
      <tr><td><strong>User</strong></td><td>name, email, password (select:false), role (USER/DRIVER/ADMIN), refreshToken</td><td>email (unique)</td></tr>
      <tr><td><strong>Ambulance</strong></td><td>driverName, vehicleNumber, status, currentLocation (GeoJSON), lastPing, assignedSessionId</td><td>2dsphere on currentLocation</td></tr>
      <tr><td><strong>Hospital</strong></td><td>name, address, location, specializations[], availableBeds, isActive (soft delete)</td><td>location (2dsphere)</td></tr>
      <tr><td><strong>EmergencySession</strong></td><td>Full lifecycle document with eventLog subdocument array</td><td>userId, status, createdAt</td></tr>
    </tbody>
  </table>
</div>

<!-- 05 ALGORITHM -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">05</div>
    <div><h2>Assignment Algorithm</h2><div class="sub">Candidate generation + weighted ranking &mdash; same pattern as Uber dispatch, Netflix recommendations, Google Search</div></div>
  </div>
  <div class="grid-3" style="margin-bottom:24px">
    <div class="metric"><div class="val">&lt;300ms</div><div class="lbl">End-to-end SLA</div></div>
    <div class="metric"><div class="val">5-10</div><div class="lbl">Candidates scored</div></div>
    <div class="metric"><div class="val">229ms</div><div class="lbl">Promise.all writes</div></div>
  </div>
  <h3>Phase 1 &mdash; Candidate Generation (Optimized for Recall)</h3>
  <div class="card">
    <ul>
      <li>Read all available ambulance IDs from <code>ambulance:available</code> Redis Set &mdash; <strong>O(1)</strong>, no MongoDB query</li>
      <li>Encode patient location as 7-character geohash (~150m x 150m precision)</li>
      <li>Use 5-character prefix (city-block level) + all 8 neighbouring cells &mdash; handles boundary problem where an ambulance 10m away is in an adjacent geohash cell and would be missed by exact match</li>
      <li>ioredis pipeline fetches all ambulance locations in a <strong>single round trip</strong> (not N individual GET commands)</li>
      <li>Haversine distance computed for prefix-matching ambulances &rarr; sort ascending</li>
      <li>Top 10 by distance returned (typically 3-10 in real deployment at city scale)</li>
    </ul>
  </div>
  <h3>Geo-Partition Zone Filter (New Engineering Decision)</h3>
  <p>After Phase 1, before scoring: ambulances additionally filtered by city-zone geohash (precision 4 = ~40km x 20km). Prevents scoring ambulances physically in a different city that may appear in the Redis Set due to registration anomalies.</p>
  <pre>// City-zone pre-filter (added as new engineering decision)
const searchZones = getSearchZones(patientLat, patientLng); // precision-4 + 8 neighbors
const zoneFiltered = await Promise.all(
  candidates.map(async (c) => {
    const zone = await redis.get(`ambulance:${c._id}:zone`);
    if (!zone) return c;  // include if no zone data stored
    return searchZones.some(z => zone.startsWith(z)) ? c : null;
  })
);
logger.debug(`Geo-partition: ${candidates.length} -&gt; ${zoneFiltered.filter(Boolean).length} in zone`);</pre>
  <h3>Phase 2 &mdash; Weighted Scoring (Optimized for Precision)</h3>
  <div class="card blue">
    <p>Maps API called once for all top-5 candidates in a single batched request &mdash; not N individual calls. ETAs use live traffic data for accuracy.</p>
    <pre>score = (ETA_score x 0.50) + (distance_score x 0.30) + (freshness_score x 0.20)

ETA_score:        real ETA seconds from Maps API / 600s  -&gt; normalized 0-1
distance_score:   haversine km / 10km                    -&gt; normalized 0-1
freshness_score:  (Date.now() - lastPing) / 30min        -&gt; normalized 0-1

Winner = lowest combined score (closer + faster + fresher data)</pre>
  </div>
  <h3>Promise.all &mdash; The 144ms Optimisation</h3>
  <div class="callout good">
    <div class="icon">&#x26A1;</div>
    <div class="callout-body">
      <strong>Sequential await: 373ms &rarr; Promise.all: 229ms &mdash; 144ms saved</strong>
      <p>After selecting the winner, three writes must happen: update ambulance in Redis, update MongoDB session, and emit Socket.io event. Sequential awaits chain them (each waits for previous). Promise.all fires all three simultaneously &mdash; latency drops from sum-of-RTTs to max-of-RTTs.</p>
    </div>
  </div>
  <h3>Score Collapse &mdash; Subtle Bug We Fixed</h3>
  <div class="callout warn">
    <div class="icon">&#x1F41B;</div>
    <div class="callout-body">
      <strong>Problem:</strong> ETAs clustering near the same value collapse to identical normalized scores.
      <p>Two ambulances with ETAs of 12min and 25min can both normalize to ~1.0 when divided by the max ETA. The algorithm treats them as identical. <strong>Fix:</strong> Rank-based scoring &mdash; use position in the sorted list (rank 1, 2, 3...) rather than the raw normalized value. Position is always distinct.</p>
    </div>
  </div>
</div>

<!-- 06 REAL-TIME -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">06</div>
    <div><h2>Real-Time Layer</h2><div class="sub">Socket.io rooms &middot; JWT middleware &middot; GPS delta compression &middot; ETA recalculation loop &middot; 15 socket events</div></div>
  </div>
  <div class="callout note">
    <div class="icon">&#x1F4A1;</div>
    <div class="callout-body">
      <strong>Why session rooms and not user rooms?</strong>
      <p>The emergency session is the natural unit of coordination, not the individual. Both patient and driver need identical state at the same time. Session rooms eliminate the routing logic that user rooms would require when broadcasting ETA updates to the correct participants.</p>
    </div>
  </div>
  <h3>JWT Authentication at the Middleware Layer</h3>
  <pre>io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;   // userId + role available on all handlers
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
// Why middleware and not connection handler?
// Middleware runs BEFORE connection opens. Unauthenticated socket never opens.
// Connection handler is too late - socket is already open and consuming resources.</pre>
  <h3>GPS Delta Compression</h3>
  <table>
    <thead><tr><th>Scenario</th><th>Action</th><th>Redis Writes</th></tr></thead>
    <tbody>
      <tr><td>Driver moved &gt; 10 meters</td><td>Write ambulance:{id}:location, broadcast driver_location to session room</td><td>1 per update</td></tr>
      <tr><td>Driver moved &le; 10 meters</td><td>Silent return &mdash; no Redis write, no socket emit, no log spam</td><td>0</td></tr>
    </tbody>
  </table>
  <div class="callout good">
    <div class="icon">&#x26A1;</div>
    <div class="callout-body">
      <strong>Impact:</strong> Without delta compression, a stationary ambulance at a red light generates 15 Redis writes and 15 socket broadcasts per minute &mdash; all identical. With 10m threshold: 0 broadcasts. 60% reduction in socket traffic for typical urban driving. Enforced server-side &mdash; misbehaving client cannot bypass it.
    </div>
  </div>
  <h3>ETA Recalculation Loop (30s interval)</h3>
  <div class="flow">
    <div class="flow-step"><div class="flow-dot blue">1</div><div class="flow-content"><h5>Driver joins session room &rarr; 30-second interval starts</h5><p>Tracked in module-level etaIntervals Map keyed by sessionId. One interval per active session, cleaned up on disconnect.</p></div></div>
    <div class="flow-step"><div class="flow-dot blue">2</div><div class="flow-content"><h5>Read driver GPS from Redis (ambulance:{id}:location)</h5><p>Falls back to socket-cached position if Redis key expired (within 300s disconnect window).</p></div></div>
    <div class="flow-step"><div class="flow-dot blue">3</div><div class="flow-content"><h5>Call Maps API for fresh live-traffic ETA</h5><p>Falls back to haversine / 30km/h if Maps API unavailable. Haversine result still useful for progress indication.</p></div></div>
    <div class="flow-step"><div class="flow-dot blue">4</div><div class="flow-content"><h5>Write session:{id}:eta (90s TTL) + broadcast eta_update</h5><p>90s TTL = 3 full update cycles of buffer. Frontend updates ETA display + progress bar animation (CSS transition 1s).</p></div></div>
  </div>
  <h3>Disconnect Handling</h3>
  <ul>
    <li><strong>Stop ETA interval</strong> &mdash; clear from etaIntervals Map</li>
    <li><strong>Extend location TTL</strong> &mdash; <code>redis.expire(key, 300)</code> gives 5 more minutes (single atomic command, no value rewrite)</li>
    <li><strong>Emit driver_disconnected</strong> &mdash; patient UI shows "Signal lost" at last known position</li>
  </ul>
  <div class="callout note">
    <div class="icon">&#x1F4A1;</div>
    <div class="callout-body">
      <strong>redis.expire vs GET + SET</strong>
      <p><code>redis.expire(key, 300)</code> is a single atomic O(1) command that only updates the TTL &mdash; value untouched. GET + SET is two commands with a race window where another process can modify the value between them. expire is both cheaper and race-condition-free.</p>
    </div>
  </div>
  <h3>Complete Socket.io Event Map</h3>
  <table>
    <thead><tr><th>Event</th><th>Direction</th><th>When Fired</th><th>Frontend Action</th></tr></thead>
    <tbody>
      <tr><td><code>ambulance_assigned</code></td><td>Server &rarr; Patient</td><td>Assignment complete</td><td>Show driver card, init ETA bar, center map</td></tr>
      <tr><td><code>driver_location</code></td><td>Server &rarr; Patient</td><td>GPS update (delta passed)</td><td>Move ambulance marker on map</td></tr>
      <tr><td><code>location_update</code></td><td>Server &rarr; Patient</td><td>Alternative GPS event name</td><td>Update activeSession ambulance coordinates</td></tr>
      <tr><td><code>eta_update</code></td><td>Server &rarr; Patient</td><td>Every 30 seconds</td><td>Update ETA display + progress bar</td></tr>
      <tr><td><code>general_first_aid</code></td><td>Server &rarr; Patient</td><td>Session trigger</td><td>Show green first aid card</td></tr>
      <tr><td><code>specialised_first_aid</code></td><td>Server &rarr; Patient</td><td>Severity 4-5, AI ready</td><td>Show purple AI first aid card</td></tr>
      <tr><td><code>hospital_options</code></td><td>Server &rarr; Patient</td><td>AI hospital selection done</td><td>Show hospital destination card</td></tr>
      <tr><td><code>delay_detected</code></td><td>Server &rarr; Patient</td><td>Drift &gt;3min detected</td><td>Show amber delay alert, toast.error</td></tr>
      <tr><td><code>ai_suggestion</code></td><td>Server &rarr; Patient</td><td>Fallback Level 3</td><td>Show blue AI suggestion card</td></tr>
      <tr><td><code>ambulance_swapped</code></td><td>Server &rarr; Patient</td><td>Fallback Level 2 success</td><td>Update ambulance info, new ETA</td></tr>
      <tr><td><code>route_updated</code></td><td>Server &rarr; Patient</td><td>Fallback Level 1 success</td><td>Update ETA display</td></tr>
      <tr><td><code>driver_arrived</code></td><td>Server &rarr; Patient</td><td>Driver confirms arrival</td><td>Show green arrival banner</td></tr>
      <tr><td><code>arrival_otp_generated</code></td><td>Server &rarr; Patient</td><td>Driver requests OTP</td><td>Show large monospace OTP + expiry</td></tr>
      <tr><td><code>driver_disconnected</code></td><td>Server &rarr; Patient</td><td>Driver socket drops</td><td>Show "Signal lost" indicator</td></tr>
      <tr><td><code>session_status_changed</code></td><td>Server &rarr; Both</td><td>State transition</td><td>Status badge update, redirect on RESOLVED/CANCELLED</td></tr>
      <tr><td><code>chat_message</code></td><td>Both &harr; Both</td><td>Message sent</td><td>Show in ChatPanel, unread count badge</td></tr>
    </tbody>
  </table>
</div>

<!-- 07 DELAY DETECTION -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">07</div>
    <div><h2>Delay Detection &amp; Fallback Chain</h2><div class="sub">Proactive monitoring &middot; BullMQ persistence &middot; 4-level automated response</div></div>
  </div>
  <div class="callout crit">
    <div class="icon">&#x1F525;</div>
    <div class="callout-body">
      <strong>Most dispatch systems are passive. RapidAid is active.</strong>
      <p>A background worker runs continuously for every active session, checking whether the ambulance is on track. When it detects a problem, it does not alert a human operator. It acts.</p>
    </div>
  </div>
  <h3>BullMQ vs setInterval</h3>
  <table>
    <thead><tr><th>Approach</th><th>Problem</th></tr></thead>
    <tbody>
      <tr><td>setInterval</td><td>Lives in Node.js memory. Any restart, deploy, or crash silently kills all active delay monitors. Sessions lose monitoring with no error or alert. System looks healthy but isn't working.</td></tr>
      <tr><td><strong>BullMQ (our choice)</strong></td><td>Jobs persisted in Redis. Survives restarts, deploys, scaling events. jobId: delay:{sessionId} = idempotent scheduling, no duplicate workers. throw err = BullMQ retries. Auto-cancel on RESOLVED/CANCELLED.</td></tr>
    </tbody>
  </table>
  <h3>Drift Detection Logic</h3>
  <pre>// BullMQ worker processor (fires every 60 seconds per active session)
const { etaMinutes: currentEta } = JSON.parse(await redis.get(`session:${sessionId}:eta`));
const drift = currentEta - initialEtaMinutes;  // initialEtaMinutes captured at assignment

logger.debug(`Delay check: session ${sessionId} | initial=${initialEtaMinutes}min | current=${currentEta}min | drift=${drift}min`);

if (drift > 3) {
  session.status = 'DELAYED';
  session.addEvent('DELAYED', { drift, initialEta: initialEtaMinutes, currentEta, detectedAt: new Date() });
  await session.save();
  io.to(`session:${sessionId}`).emit('delay_detected', { drift, currentEta, sessionId });
  await triggerFallback(sessionId, currentEta);  // 4-level chain begins
}</pre>
  <h3>The 4-Level Fallback Chain</h3>
  <p>Runs sequentially. Short-circuits at first success for L1 and L2. L3 and L4 always run together if L1+L2 both fail.</p>
  <div class="level">&#x26A1; Level 1 &mdash; Reroute</div>
  <div class="card red">
    <p><strong>Threshold:</strong> &gt;1 minute improvement required &mdash; even small improvements justify rerouting since it's free (driver just takes a different route)</p>
    <ul>
      <li>Read current driver GPS from Redis <code>ambulance:{id}:location</code></li>
      <li>Call Maps API with live traffic for fresh ETA from driver's current position to patient</li>
      <li>If &gt;1 min better: update <code>session:{id}:eta</code> in Redis, append REROUTED to eventLog, emit <code>route_updated</code> to session room</li>
      <li>If not enough improvement: fall through to Level 2</li>
    </ul>
  </div>
  <div class="level l2">&#x1F504; Level 2 &mdash; Swap Ambulance</div>
  <div class="card amber">
    <p><strong>Threshold:</strong> &gt;2 minutes improvement required &mdash; higher bar because swapping has real costs (original driver disrupted, handoff period)</p>
    <ul>
      <li>Find all AVAILABLE ambulances near patient using geohash (excludes currently assigned)</li>
      <li>Get ETAs for all alternatives via Promise.all (parallel)</li>
      <li>If best alternative &gt;2 min better: reassign session, old ambulance &rarr; AVAILABLE in Redis Set, new ambulance &rarr; BUSY, emit <code>ambulance_swapped</code></li>
    </ul>
  </div>
  <div class="level l3">&#x1F916; Level 3 &mdash; AI Patient Message</div>
  <div class="card purple">
    <p><strong>Trigger:</strong> L1 and L2 both failed to improve the situation</p>
    <ul>
      <li>Groq LLaMA 3 generates: calm 1-2 sentence patient message + one specific first-aid action</li>
      <li>Prompt constraints: <em>never says "unfortunately" or "sorry for the delay"</em>, always mentions the ETA in the message</li>
      <li>Temperature 0.4 &mdash; slight variation prevents robotic repetition across different patients</li>
      <li>Hardcoded fallback by emergency type if Groq unavailable</li>
      <li>Emits <code>ai_suggestion</code> event to session room</li>
    </ul>
  </div>
  <div class="level l4">&#x1F3E5; Level 4 &mdash; Hospital Webhook</div>
  <div class="card green">
    <p><strong>Trigger:</strong> Always runs after L3 regardless of L3 success &mdash; different purpose (operational, not patient-facing)</p>
    <ul>
      <li>HTTP POST to hospital system: sessionId, emergencyType, severityLevel, patientLocation, ambulanceDelayed: true, currentEta, timestamp</li>
      <li>Hospital desk alerted to prepare receiving bay before patient arrives</li>
      <li>Appends HOSPITAL_WEBHOOK_TRIGGERED to eventLog with full payload</li>
      <li>L4 failure does not stop L3 from completing (independent try/catch)</li>
    </ul>
  </div>
</div>

<!-- 08 AI LAYER -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">08</div>
    <div><h2>AI Layer &mdash; 6 Services</h2><div class="sub">Groq LLaMA 3 &middot; Structured JSON output &middot; Hardcoded fallbacks &middot; Temperature progression</div></div>
  </div>
  <div class="callout note">
    <div class="icon">&#x1F916;</div>
    <div class="callout-body">
      <strong>The AI in RapidAid is not a chatbot.</strong>
      <p>Every service returns structured JSON consumed directly by the dispatch pipeline. The severity score overrides user input. The hospital ranking sets hospitalId on the session. First-aid instructions push to the patient socket automatically. Every AI service has a hardcoded fallback so Groq being unavailable never blocks dispatch.</p>
    </div>
  </div>
  <h3>Why Groq over OpenAI/Anthropic?</h3>
  <table>
    <thead><tr><th>Provider</th><th>Avg Latency</th><th>Suitable for RapidAid?</th></tr></thead>
    <tbody>
      <tr><td>OpenAI GPT-4o</td><td>1-5 seconds</td><td>&#x274C; Too slow for critical dispatch path</td></tr>
      <tr><td>Anthropic Claude</td><td>2-4 seconds</td><td>&#x274C; Cannot meet 300ms assignment SLA</td></tr>
      <tr><td><strong>Groq LLaMA 3</strong></td><td><strong>&lt;300ms</strong></td><td><strong>&#x2705; Matches ambulance assignment SLA</strong></td></tr>
    </tbody>
  </table>
  <h3>Temperature Progression</h3>
  <table>
    <thead><tr><th>Temperature</th><th>Services</th><th>Rationale</th></tr></thead>
    <tbody>
      <tr><td><strong>0.2</strong></td><td>Triage, Specialised First Aid</td><td>Safety-critical classification. A random severity score has clinical consequences. Determinism over variety.</td></tr>
      <tr><td><strong>0.4</strong></td><td>Delay Patient Message</td><td>Slight variation prevents robotic repetition. Still grounded &mdash; cannot afford hallucinated first-aid advice.</td></tr>
      <tr><td><strong>0.5</strong></td><td>Driver Quick Replies</td><td>Driver uses these multiple times per session. Needs variety to stay useful. Suggestions, not clinical guidance.</td></tr>
    </tbody>
  </table>
  <h3>All 6 AI Services in Detail</h3>
  <div class="ai-service">
    <h4>1. generalFirstAidService.js <span class="temp-badge">Hardcoded &mdash; Zero Latency</span></h4>
    <p>Static lookup object mapping all 14 emergency types to {title, steps[], warnings[]}. Fires for <strong>every</strong> emergency regardless of severity. Always instant, never fails, zero network call. This is the "always available" baseline &mdash; patient always has something actionable immediately while AI services process. Also stored in MongoDB session document as generalFirstAid field.</p>
  </div>
  <div class="ai-service">
    <h4>2. triageService.js <span class="temp-badge">temp=0.2</span></h4>
    <p>Input: user description + emergency type. Output: <code>{severity: 1-5, confidence: low/medium/high, reasoning, immediateActions[]}</code>. Overrides user-provided severity only on high confidence. Severity clamped to 1-5 range. If no description or description &lt;5 chars, skips AI and uses type-based defaults. Falls back to hardcoded defaults by emergency type if Groq fails.</p>
  </div>
  <div class="ai-service">
    <h4>3. hospitalService.js <span class="temp-badge">temp=0.2</span></h4>
    <p>Pre-filters all active hospitals by haversine distance (top 5 only, cheap) &rarr; sends to AI with severity + specialization context. AI returns ranked list of 3 with per-hospital reasoning. Sets hospitalId on session document. Patient sees AI-selected hospital with "AI Selected &#x2728;" badge. Falls back to distance-only sort if Groq fails.</p>
  </div>
  <div class="ai-service">
    <h4>4. firstAidService.js <span class="temp-badge">temp=0.2</span></h4>
    <p>AI-generated specialised first aid. Auto-triggered for severity 4-5 only (lower severity doesn't need AI-enhanced guidance). Returns exactly 5 steps (capped regardless of AI output &mdash; cognitive load research shows people stop reading past 5 items) + warnings[] + estimatedTimeMin. All steps must start with action verbs. Delivered to patient socket within 1 second. Falls back to hardcoded responses per type.</p>
  </div>
  <div class="ai-service">
    <h4>5. delayMessageService.js <span class="temp-badge">temp=0.4</span></h4>
    <p>Triggered at Fallback Level 3. Input: emergencyType, severity, drift, currentEta. Output: {patientMessage (1-2 sentences, &lt;50 words, must mention ETA), firstAidAction (one specific action)}. Prompt hard-constrains against "unfortunately" and "sorry for the delay". Falls back to hardcoded ETA-aware templates by emergency type.</p>
  </div>
  <div class="ai-service">
    <h4>6. driverAssistService.js <span class="temp-badge">temp=0.5</span></h4>
    <p>On-demand by driver. Input: last patient message + current ETA. Output: exactly 3 short reply options (under 10 words each). Driver taps to send without typing while driving. Always returns exactly 3 &mdash; never more, never fewer. Higher temperature for variation since driver requests these multiple times per session. Temperature 0.5 keeps suggestions practical (not hallucinated).</p>
  </div>
  <h3>Rate Limiting + Exponential Backoff</h3>
  <div class="card">
    <p>Groq free tier: ~30 requests/minute. Bottleneck library implements a token bucket: 25 tokens max, refill every 60 seconds, minimum 2 seconds between requests. On 429: wait 1s &rarr; retry. Wait 2s &rarr; retry. Wait 4s &rarr; retry. After 3 retries: throw &rarr; caller uses hardcoded fallback. System never fails because Groq is rate-limited.</p>
  </div>
</div>

<!-- 09 FRONTEND -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">09</div>
    <div><h2>Frontend &mdash; Complete Explanation</h2><div class="sub">React 19 + Vite 8 &middot; Role-based routing &middot; Patient section &middot; Driver section &middot; All 7 pages explained</div></div>
  </div>
  <h3>Dependencies Overview</h3>
  <table>
    <thead><tr><th>Package</th><th>Version</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td>react + react-dom</td><td>^19.2.8</td><td>UI framework with concurrent rendering</td></tr>
      <tr><td>vite</td><td>^8.2.2</td><td>Dev server + production bundler (native ES modules)</td></tr>
      <tr><td>tailwindcss</td><td>^4.3.3</td><td>Utility-first CSS with custom design tokens</td></tr>
      <tr><td>react-router-dom</td><td>^7.18.2</td><td>Client-side routing, ProtectedRoute + RoleRoute</td></tr>
      <tr><td>zustand</td><td>^5.0.15</td><td>Global state (authStore, sessionStore, driverStore)</td></tr>
      <tr><td>socket.io-client</td><td>^4.8.3</td><td>WebSocket client, JWT in handshake auth</td></tr>
      <tr><td>react-leaflet + leaflet</td><td>^5.0.0 / ^1.9.4</td><td>Interactive dark-mode tracking map</td></tr>
      <tr><td>framer-motion</td><td>^13.1.1</td><td>Landing page animations (fadeUp, scroll-triggered)</td></tr>
      <tr><td>react-hot-toast</td><td>^2.6.0</td><td>Non-intrusive toast notifications</td></tr>
      <tr><td>lucide-react</td><td>^1.33.0</td><td>Consistent icon system throughout</td></tr>
      <tr><td>axios</td><td>^1.19.0</td><td>HTTP client with JWT interceptor</td></tr>
      <tr><td>@tanstack/react-query</td><td>^5.101.4</td><td>Server state management, caching</td></tr>
    </tbody>
  </table>
  <h3>Routing Architecture</h3>
  <pre>BrowserRouter
├── /                 → Landing.jsx          (public, no auth required)
├── /login            → Login.jsx            (public)
├── /register         → Register.jsx         (public)
└── ProtectedRoute    (JWT required - redirects to /login if not authenticated)
    ├── RoleRoute [USER]
    │   ├── /dashboard           → PatientDashboard.jsx
    │   └── /emergency/:id       → EmergencyTracking.jsx
    ├── RoleRoute [DRIVER]
    │   └── /driver              → DriverDashboard.jsx
    └── RoleRoute [ADMIN]
        └── /admin               → AdminDashboard.jsx
* → Navigate to /  (catch-all)</pre>

  <div class="screen-card">
    <div class="screen-header"><div class="screen-dots"><div class="screen-dot"></div><div class="screen-dot"></div><div class="screen-dot"></div></div><div class="screen-title">/ &mdash; Landing.jsx</div></div>
    <div class="screen-body">
      <h3 style="margin-top:0">&#x1F3E0; Landing Page</h3>
      <p>Full-viewport hero with animated background blobs (CSS radial gradients with animate-pulse class). Framer Motion fadeUp animations for all hero elements with staggered delays (i * 0.1). Animated scroll indicator at bottom.</p>
      <p><strong>Content sections:</strong></p>
      <ul>
        <li><strong>Hero</strong> &mdash; Red ambulance icon box, "Emergency Help. Under 300ms." headline, subtitle, two CTAs: "Get Help Now" (&rarr; /register), "I'm a Driver" (&rarr; /login)</li>
        <li><strong>Stats bar</strong> &mdash; glassmorphism card with 4 key metrics (&lt;300ms Assignment, Live GPS Tracking, 4-Level Fallback, LLaMA 3 AI)</li>
        <li><strong>How it works</strong> &mdash; 3-step flow (&#x1F198; Trigger &rarr; &#x1F4CD; Track &rarr; &#x1F3E5; Arrive) with scroll-triggered whileInView animations</li>
        <li><strong>Features grid</strong> &mdash; 6 cards with Lucide icons (Zap, MapPin, Brain, Clock, Shield, AlertTriangle), hover border effect, scroll-triggered staggered entrance</li>
      </ul>
    </div>
  </div>

  <div class="screen-card">
    <div class="screen-header"><div class="screen-dots"><div class="screen-dot"></div><div class="screen-dot"></div><div class="screen-dot"></div></div><div class="screen-title">/dashboard &mdash; PatientDashboard.jsx</div></div>
    <div class="screen-body">
      <h3 style="margin-top:0">&#x1F6A8; Patient Dashboard</h3>
      <p><strong>Active Emergency Section</strong> (shown when sessions exist with status not RESOLVED/CANCELLED):</p>
      <ul>
        <li>Animated pulsing red dot (animate-ping) next to "Active Emergency" heading</li>
        <li>Card (variant="red") shows: emergency type, StatusBadge, time-ago, "View Live Tracking" button, "Cancel Emergency" button with window.confirm dialog</li>
        <li>First Aid Card (variant="green") immediately below &mdash; uses session.generalFirstAid from database OR static BASIC_FIRST_AID lookup by emergencyType. Numbered steps + amber AlertTriangle warnings. Always present, no waiting for AI.</li>
      </ul>
      <p><strong>SOS Button</strong> &mdash; large pulsing red circular button (CSS sos-button class). Disabled with opacity:0.4 and not-allowed cursor if active emergency exists. Shows explanation text below. Opens TriggerModal on click.</p>
      <p><strong>Past Sessions</strong> &mdash; 2-column grid of Card components showing type, date, StatusBadge for all RESOLVED/CANCELLED sessions.</p>
    </div>
  </div>

  <div class="screen-card">
    <div class="screen-header"><div class="screen-dots"><div class="screen-dot"></div><div class="screen-dot"></div><div class="screen-dot"></div></div><div class="screen-title">TriggerModal &mdash; TriggerModal.jsx</div></div>
    <div class="screen-body">
      <h3 style="margin-top:0">&#x1F6A8; Emergency Trigger Modal</h3>
      <ul>
        <li><strong>Emergency Type</strong> &mdash; native select dropdown with all 14 types (CARDIAC, ACCIDENT, STROKE, FIRE, SNAKE_BITE, BREATHING, HEAD_INJURY, BURNS, POISONING, PREGNANCY, TRAUMA, RESPIRATORY, NEUROLOGICAL, OTHER). Defaults to OTHER.</li>
        <li><strong>Severity picker</strong> &mdash; 5 inline buttons color-coded: blue (1-2 minor/low), amber (3 moderate), red (4-5 severe/critical). Active state shows shadow glow. Descriptive label + hint text below (e.g., "Life-threatening").</li>
        <li><strong>Description textarea</strong> &mdash; "Help our AI provide better first aid..." placeholder. 24-char height. Optional but recommended for AI triage quality.</li>
        <li><strong>GPS status</strong> &mdash; "Acquiring GPS location..." spinner while useGeolocation hook runs. Error message if GPS denied. Button disabled during GPS acquisition.</li>
        <li><strong>Submit</strong> &mdash; red "Dispatch Ambulance Now" button with AlertTriangle icon. Loading state on submit. Error toast for ACTIVE_SESSION_EXISTS. Success: toast + navigate to /emergency/:id.</li>
      </ul>
    </div>
  </div>

  <div class="screen-card">
    <div class="screen-header"><div class="screen-dots"><div class="screen-dot"></div><div class="screen-dot"></div><div class="screen-dot"></div></div><div class="screen-title">/emergency/:id &mdash; EmergencyTracking.jsx</div></div>
    <div class="screen-body">
      <h3 style="margin-top:0">&#x1F4E1; Emergency Tracking Page (The Most Complex Page)</h3>
      <p>Split-panel layout: 35% scrollable left panel + 65% map right panel (stacked on mobile). Handles 14 distinct socket events via useSocketEvent hooks.</p>
      <p><strong>Left Panel &mdash; 10 Information Cards:</strong></p>
      <ol>
        <li><strong>Session Header</strong> &mdash; emergency type emoji, type name, severity Badge (MINOR/LOW/MODERATE/SEVERE/CRITICAL with color), StatusBadge, timeAgo timestamp, description in italics if present</li>
        <li><strong>ETA + Driver Card</strong> &mdash; Skeleton loaders while awaiting assignment. On assignment: driver name, vehicle number, clickable tel: link for contact. Live ETA number (Math.round), "estimated arrival" label, animated gradient progress bar (CSS transition 1s ease-out, gradient blue&rarr;green), "X% of the way" text. StatusBadge for current status.</li>
        <li><strong>General First Aid Card</strong> (glass-green) &mdash; numbered steps with green circle badges, amber warning row with AlertTriangle icons. Loads from session data on mount.</li>
        <li><strong>AI Specialised First Aid Card</strong> (glass-purple) &mdash; "Powered by LLaMA" Badge, up to 5 steps (slice(0,5)), optional estimatedTimeMin Badge, red warning rows. Appears on specialised_first_aid socket event.</li>
        <li><strong>Hospital Card</strong> &mdash; name, address, distance, speciality, "AI Selected &#x2728;" Badge. Shows topHospital from hospitalRanking or populated hospitalId.</li>
        <li><strong>Delay Alert Card</strong> (glass-amber) &mdash; AlertTriangle icon, delay message, new ETA if available. Appears on delay_detected event + toast.error().</li>
        <li><strong>AI Suggestion Card</strong> (glass-blue) &mdash; Bot icon, AI-generated delay message + first aid action. Appears on ai_suggestion event (Fallback L3).</li>
        <li><strong>Driver Disconnected Alert</strong> &mdash; WifiOff icon, 70% opacity. "Signal lost" message. Appears on driver_disconnected event.</li>
        <li><strong>OTP Display</strong> (glass-blue) &mdash; "Arrival OTP" header, 4-digit monospace OTP in large text (tracking-[0.3em]), expiry countdown. Appears on arrival_otp_generated event.</li>
        <li><strong>Chat Panel</strong> &mdash; collapsed by default. Toggle button with MessageCircle icon + red unread count badge. Expand reveals ChatPanel component with message history and send input.</li>
      </ol>
      <p><strong>Right Panel &mdash; Live Map:</strong></p>
      <ul>
        <li>react-leaflet MapContainer with dark CartoDB tile layer, zoomControl disabled</li>
        <li>Patient marker: pulsing red CSS DivIcon (&lt;div class="patient-marker"&gt;)</li>
        <li>Ambulance marker: &#x1F691; emoji DivIcon</li>
        <li>MapRecenter component: fitBounds() when both markers known (with padding 50px), flyTo zoom-16 when only patient known</li>
        <li>ETA overlay badge (absolute bottom-right, z-index 1000): ETA minutes + StatusBadge in glassmorphism pill</li>
      </ul>
    </div>
  </div>

  <div class="screen-card">
    <div class="screen-header"><div class="screen-dots"><div class="screen-dot"></div><div class="screen-dot"></div><div class="screen-dot"></div></div><div class="screen-title">/driver &mdash; DriverDashboard.jsx</div></div>
    <div class="screen-body">
      <h3 style="margin-top:0">&#x1F697; Driver Dashboard</h3>
      <ul>
        <li><strong>LocationEmitter component</strong> &mdash; renders invisibly. When active prop is true (online or has assignment), calls Navigator.geolocation.watchPosition every 4 seconds and emits to socket. Drives the GPS update loop.</li>
        <li><strong>Online/Offline toggle</strong> &mdash; "Go Online" (green button) / "Go Offline" (danger button). Status text shows "Available" / "Offline". Calls toggleOnline action in driverStore.</li>
        <li><strong>Assignment Alert</strong> (glass-red) &mdash; shows when assignment arrives via socket. Displays: emergencyType, severityLevel. "View Details &amp; Navigate" full-width button.</li>
        <li><strong>Waiting state</strong> &mdash; clean centered glass card with contextual text: "Waiting for emergencies..." (when online) or "Go online to receive emergencies." (when offline)</li>
      </ul>
    </div>
  </div>
</div>

<!-- 10 SECURITY -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">10</div>
    <div><h2>Security &amp; Authentication</h2><div class="sub">Two-token JWT &middot; Ownership authorization &middot; Enumeration prevention &middot; Defense in depth</div></div>
  </div>
  <h3>Two-Token JWT Architecture</h3>
  <table>
    <thead><tr><th>Token</th><th>Expiry</th><th>Storage</th><th>Validation</th></tr></thead>
    <tbody>
      <tr><td><strong>Access Token</strong></td><td>15 minutes</td><td>localStorage</td><td>Stateless &mdash; verified from JWT_SECRET only. No database query. Any server instance validates.</td></tr>
      <tr><td><strong>Refresh Token</strong></td><td>7 days</td><td>httpOnly cookie</td><td>Hits database on every use. Verifies user still exists. Issues new refresh token (rotation).</td></tr>
    </tbody>
  </table>
  <div class="callout note">
    <div class="icon">&#x1F6E1;&#xFE0F;</div>
    <div class="callout-body">
      <strong>Separate Secrets + Rotation</strong>
      <p>JWT_SECRET &ne; JWT_REFRESH_SECRET. A compromised access secret does not affect refresh validation. Stolen access token expires in 15 minutes maximum (blast radius limit). Each refresh issues a new refresh token and invalidates the old one (prevents replay attacks on stolen refresh tokens).</p>
    </div>
  </div>
  <h3>Ownership-Based Authorization</h3>
  <p>Emergency sessions are owned by their creator. Every read or update verifies that <code>req.user.userId</code> (from the JWT &mdash; which the client cannot forge) matches the session's <code>userId</code> in the database.</p>
  <ul>
    <li>Authenticated user with someone else's sessionId &rarr; <strong>403 Forbidden</strong> (not 404, which would confirm the session exists)</li>
    <li>Prevents horizontal privilege escalation &mdash; authenticated users cannot access each other's data</li>
  </ul>
  <h3>User Enumeration Prevention</h3>
  <div class="callout warn">
    <div class="icon">&#x26A0;&#xFE0F;</div>
    <div class="callout-body">
      <strong>Problem:</strong> Different errors for "user not found" vs "wrong password" leaks information.
      <p>Attackers probe email addresses to discover which are registered, building a list for credential stuffing. RapidAid returns the same error for both: <strong>"Invalid credentials"</strong>. The attacker cannot determine which condition triggered.</p>
    </div>
  </div>
  <h3>Complete Security Layers</h3>
  <table>
    <thead><tr><th>Layer</th><th>Implementation</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td>Security headers</td><td>Helmet.js (15+ headers)</td><td>X-Content-Type-Options, X-Frame-Options, HSTS, CSP, Referrer-Policy</td></tr>
      <tr><td>Rate limiting</td><td>express-rate-limit: 100 req/15min/IP</td><td>Prevents brute force and DoS attacks on all /api routes</td></tr>
      <tr><td>Input validation</td><td>express-validator on all endpoints</td><td>Schema validation before business logic runs, prevents injection</td></tr>
      <tr><td>Body size limit</td><td>express.json({ limit: "10kb" })</td><td>Prevents oversized payload attacks</td></tr>
      <tr><td>Password hashing</td><td>bcryptjs with salt rounds</td><td>Adaptive cost factor, resistant to rainbow tables and GPU attacks</td></tr>
      <tr><td>Password exclusion</td><td>select: false on password field</td><td>Hash never returned in API responses even if developer error</td></tr>
      <tr><td>CORS</td><td>Configured per environment, credentials: true</td><td>Prevents cross-origin requests from unauthorized domains</td></tr>
      <tr><td>Socket authentication</td><td>JWT in io.use() middleware</td><td>Unauthenticated sockets rejected before connection opens</td></tr>
      <tr><td>Role-based routing</td><td>RoleRoute component + server role check</td><td>Driver cannot access /dashboard, patient cannot access /driver</td></tr>
    </tbody>
  </table>
</div>

<!-- 11 PERFORMANCE -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">11</div>
    <div><h2>Performance &amp; Scalability</h2><div class="sub">9 measured metrics &middot; 6 key optimizations &middot; Horizontal scaling design &middot; Graceful degradation</div></div>
  </div>
  <h3>Measured Performance Numbers</h3>
  <div class="grid-3">
    <div class="metric"><div class="val">&lt;300ms</div><div class="lbl">Assignment end-to-end</div></div>
    <div class="metric"><div class="val">229ms</div><div class="lbl">Parallel write (Promise.all)</div></div>
    <div class="metric"><div class="val">&lt;200ms</div><div class="lbl">GPS driver&rarr;patient</div></div>
    <div class="metric"><div class="val">60s</div><div class="lbl">Delay check interval</div></div>
    <div class="metric"><div class="val">30s</div><div class="lbl">ETA recalculation</div></div>
    <div class="metric"><div class="val">4s</div><div class="lbl">GPS update frequency</div></div>
    <div class="metric"><div class="val">10m</div><div class="lbl">Delta compression threshold</div></div>
    <div class="metric"><div class="val">90s</div><div class="lbl">ETA Redis TTL</div></div>
    <div class="metric"><div class="val">300s</div><div class="lbl">Location preservation</div></div>
  </div>
  <h3>Key Optimizations Made</h3>
  <table>
    <thead><tr><th>Optimization</th><th>Before</th><th>After</th><th>Technique</th></tr></thead>
    <tbody>
      <tr><td>Assignment writes</td><td>373ms sequential</td><td>229ms parallel</td><td>Promise.all for 3 independent writes</td></tr>
      <tr><td>Ambulance boot sync</td><td>20 round trips</td><td>1 round trip</td><td>ioredis pipeline batching</td></tr>
      <tr><td>Read queries</td><td>Full Mongoose documents</td><td>Plain JS objects</td><td>.lean() &mdash; 2-3x faster, no change tracking</td></tr>
      <tr><td>Candidate scoring</td><td>O(n) Maps API calls</td><td>O(1) Redis + Maps API on 5-10</td><td>Geohash candidate generation + ranking</td></tr>
      <tr><td>GPS socket traffic</td><td>15/min per stationary ambulance</td><td>0/min when stationary</td><td>Server-side 10m delta compression</td></tr>
      <tr><td>TTL refresh on disconnect</td><td>GET + SET (2 commands + race)</td><td>expire (1 atomic command)</td><td>redis.expire only updates TTL</td></tr>
    </tbody>
  </table>
  <h3>Horizontal Scalability Design</h3>
  <ul>
    <li><strong>Stateless JWT</strong> &mdash; any server instance validates any token, no shared session store needed</li>
    <li><strong>Redis for all shared state</strong> &mdash; ambulance availability, GPS, ETA readable by any instance</li>
    <li><strong>BullMQ</strong> &mdash; jobs in Redis, any worker instance can process any job (not instance-local)</li>
    <li><strong>Socket.io Redis adapter</strong> &mdash; @socket.io/redis-adapter installed, rooms work across multiple server instances</li>
    <li><strong>MongoDB Atlas</strong> &mdash; managed cluster with connection pooling and read replicas</li>
  </ul>
  <h3>Graceful Degradation</h3>
  <table>
    <thead><tr><th>Component Fails</th><th>System Behaviour</th></tr></thead>
    <tbody>
      <tr><td>Groq API down</td><td>Every AI service falls back to hardcoded responses. Dispatch continues uninterrupted. Patient still gets first aid guidance.</td></tr>
      <tr><td>Google Maps down</td><td>Haversine at 30km/h provides ETA estimates. Assignment continues with slightly less accurate scores.</td></tr>
      <tr><td>Redis down</td><td>Health check returns 503 &rarr; load balancer stops routing traffic to that instance. Honest failure over lying 200.</td></tr>
      <tr><td>Driver disconnects</td><td>5-minute location preservation in Redis. Patient shown "Signal lost" at last known position.</td></tr>
      <tr><td>Socket connection drops</td><td>Socket.io automatic reconnection with exponential backoff. Room rejoin on reconnect. Missed events hydrated from REST API.</td></tr>
    </tbody>
  </table>
  <div class="callout warn">
    <div class="icon">&#x26A0;&#xFE0F;</div>
    <div class="callout-body">
      <strong>The 503 on Redis failure is intentional.</strong>
      <p>A 200 response when Redis is down tells infrastructure everything is fine. Load balancer keeps routing traffic to a broken instance. A 503 tells Railway and Nginx to stop sending requests. An honest error is more reliable than hiding the failure. This is how production systems are designed.</p>
    </div>
  </div>
</div>

<!-- 12 REAL WORLD -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">12</div>
    <div><h2>Real-World Implementation</h2><div class="sub">Deployment roadmap &middot; System integrations &middot; Regulatory considerations &middot; City-scale design</div></div>
  </div>
  <h3>Current Deployment</h3>
  <table>
    <thead><tr><th>Component</th><th>Platform</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td>Backend API</td><td>Railway</td><td>Node.js server, auto-deploys from Git, SSL via Railway domains</td></tr>
      <tr><td>Frontend</td><td>Vercel</td><td>Vite production build, CDN globally distributed</td></tr>
      <tr><td>Redis</td><td>Upstash</td><td>Serverless Redis, per-request billing, ioredis client</td></tr>
      <tr><td>MongoDB</td><td>MongoDB Atlas M0</td><td>512MB free tier, 20 ambulances + 5 hospitals seeded with real Varanasi GeoJSON</td></tr>
      <tr><td>AI</td><td>Groq Cloud</td><td>groq-sdk npm, LLaMA 3 8B model, free tier</td></tr>
    </tbody>
  </table>
  <h3>Real-World Deployment Roadmap</h3>
  <div class="flow">
    <div class="flow-step"><div class="flow-dot">1</div><div class="flow-content"><h5>Government/City Partnership</h5><p>Integration with existing 108/102 emergency services. Real driver onboarding with vehicle verification (RC, license). Hospital API integration for actual real-time bed count data. Official GPS device integration for reliable tracking.</p></div></div>
    <div class="flow-step"><div class="flow-dot blue">2</div><div class="flow-content"><h5>Scale Infrastructure</h5><p>Multiple Railway instances behind Nginx load balancer. Socket.io Redis adapter for cross-instance rooms. MongoDB Atlas M10+ with read replicas. Upstash dedicated plan for consistent sub-ms latency at scale.</p></div></div>
    <div class="flow-step"><div class="flow-dot green">3</div><div class="flow-content"><h5>Compliance Layer</h5><p>PHI encryption at rest and in transit. HIPAA-aligned data retention (soft delete already implemented). Audit trail (eventLog) enables compliance reporting. Role-based access expanded for hospital staff and city administrators.</p></div></div>
    <div class="flow-step"><div class="flow-dot amber">4</div><div class="flow-content"><h5>Native Mobile Apps</h5><p>React Native apps using same API and Socket.io. Background geolocation for reliable driver GPS. Push notifications when ambulance assigned. Offline-first with service workers for poor connectivity areas.</p></div></div>
    <div class="flow-step"><div class="flow-dot purple">5</div><div class="flow-content"><h5>ML Enhancement Layer</h5><p>eventLog data trains delay prediction models. Historical drift patterns identify high-risk routes and time windows. AI triage improved with anonymized case outcomes. Predictive ambulance pre-positioning based on demand patterns.</p></div></div>
  </div>
  <h3>System Integration Points</h3>
  <div class="grid-2">
    <div class="card">
      <h4>Hospital Systems</h4>
      <ul>
        <li>Level 4 webhook &rarr; hospital desk alert system</li>
        <li>Real-time bed availability API integration</li>
        <li>Patient pre-registration with AI triage data</li>
        <li>Specialisation matching &mdash; cardiac patient &rarr; cardiac center</li>
      </ul>
    </div>
    <div class="card">
      <h4>Maps Enhancement</h4>
      <ul>
        <li>Traffic signal preemption for ambulance priority</li>
        <li>Turn-by-turn navigation pushed to driver app</li>
        <li>Construction/closure data for dynamic rerouting</li>
        <li>Historical ETA accuracy tracking per route</li>
      </ul>
    </div>
    <div class="card">
      <h4>Communication</h4>
      <ul>
        <li>Twilio &mdash; SMS ETA updates for feature phones</li>
        <li>IVR &mdash; voice updates for accessibility</li>
        <li>Family notification &mdash; share live tracking link</li>
        <li>Emergency contact auto-notification on trigger</li>
      </ul>
    </div>
    <div class="card">
      <h4>Analytics &amp; Operations</h4>
      <ul>
        <li>City dashboard &mdash; real-time session map</li>
        <li>Response time analytics by zone and hour</li>
        <li>Driver performance: ETA accuracy, drift rate</li>
        <li>SLA monitoring &mdash; alert if &gt;5% exceed 300ms</li>
      </ul>
    </div>
  </div>
</div>

<!-- 13 ENGINEERING DECISIONS -->
<div class="section page-break">
  <div class="section-header">
    <div class="section-num">13</div>
    <div><h2>Engineering Decisions</h2><div class="sub">10 non-obvious technical decisions with complete production rationale</div></div>
  </div>
  <div class="card"><h3>&#x23F1;&#xFE0F; The 500ms Grace Period</h3><p><strong>Decision:</strong> Assignment algorithm fires 500ms after session creation, not immediately.</p><p><strong>Reason:</strong> The assignment result is delivered via Socket.io &mdash; emitted to the session room. But the room only exists after the client joins it. If assignment completes before the client connects, the event fires into an empty room and is silently lost. The 500ms setTimeout gives the client enough time to establish the WebSocket connection and join the room. This is a deliberate race condition fix &mdash; not a hack.</p></div>
  <div class="card blue"><h3>&#x1F5C4;&#xFE0F; Two Databases, Not One</h3><p><strong>Decision:</strong> MongoDB for document storage, Redis for current state &mdash; not unified in either.</p><p><strong>Reason:</strong> MongoDB adds 10-50ms RTT per read &mdash; unacceptable for every 4-second GPS ping. Redis adds O(1) sub-millisecond reads but cannot handle the complex queries needed for analytics ("all sessions where drift exceeded 3 minutes in the last hour"). Each database does what it was designed for. Unifying them in either direction would either kill performance or kill query capability.</p></div>
  <div class="card green"><h3>&#x1F6A8; 503 on Redis Failure (Not 200)</h3><p><strong>Decision:</strong> Health check returns 503 when Redis is down.</p><p><strong>Reason:</strong> A 200 response when Redis is down tells infrastructure everything is fine. Load balancer keeps routing traffic to a broken instance. Real users get broken experiences silently. A 503 tells Railway and Nginx to stop sending requests. An honest error that triggers load balancer removal is more reliable than hiding the failure. This is standard production pattern for stateful dependency failures.</p></div>
  <div class="card amber"><h3>&#x1F525; throw err in BullMQ (Not silent catch)</h3><p><strong>Decision:</strong> Throw errors in the BullMQ job processor.</p><p><strong>Reason:</strong> A silent catch returns normally &mdash; BullMQ marks the job as <em>completed successfully</em>. The failure is hidden, no retry occurs, delay detection stops working without anyone noticing. Throwing tells BullMQ the job failed: marks it failed, records it in Redis, triggers configurable retry logic. Fail loudly, recover automatically. This is the most critical correctness decision in the delay detection system.</p></div>
  <div class="card purple"><h3>&#x1F489; Two First Aid Systems (Not One)</h3><p><strong>Decision:</strong> Hardcoded general first aid (always instant) + AI specialised first aid (severity 4-5 only).</p><p><strong>Reason:</strong> If we relied only on AI first aid, any Groq latency or failure would mean the patient gets nothing actionable while waiting. The hardcoded system fires in 0ms and always works. The AI system fires within ~300ms and provides deeper, description-aware guidance. The patient always has something immediately, and gets better guidance as AI results arrive. Two separate delivery mechanisms (different socket events, different UI cards) mean each is independent.</p></div>
  <div class="card red"><h3>&#x1F5FA;&#xFE0F; Leaflet over Google Maps JS SDK</h3><p><strong>Decision:</strong> Leaflet with CartoDB dark tiles, not Google Maps JavaScript API.</p><p><strong>Reason:</strong> Google Maps JS API costs $7 per 1,000 map loads &mdash; significant for a portfolio/demo project. Leaflet is open-source, free at any scale. CartoDB dark tiles match the app's glassmorphism dark aesthetic perfectly. react-leaflet provides React wrappers with animated marker updates and auto-fitting bounds. For production at scale, Google Maps provides better traffic data for ETA calculation, but that's the Maps Routes API (backend-only, much cheaper) &mdash; which we already use for ETAs. The map display is separate from ETA calculation.</p></div>
  <div class="card"><h3>&#x1F510; select: false on Password Field</h3><p><strong>Decision:</strong> Mongoose schema marks password with <code>select: false</code>.</p><p><strong>Reason:</strong> Even if a developer accidentally does <code>res.json(user)</code>, the password hash is not included. To access it deliberately requires explicit <code>.select('+password')</code>. Defense in depth &mdash; security should not rely on developers never making mistakes. The + prefix explicitly overrides the exclusion when needed for auth comparison. This pattern is standard in production applications handling credentials.</p></div>
  <div class="card blue"><h3>&#x1F9EE; Rank-Based Scoring vs Value Normalization</h3><p><strong>Decision:</strong> Score candidates by rank position in sorted list, not by normalized raw values.</p><p><strong>Reason:</strong> Value normalization suffers from score collapse in dense urban environments. When all ambulances have similar ETAs (e.g., 12min and 13min in a traffic-jammed city), both normalize to nearly 1.0 and are treated as equivalent. The algorithm picks arbitrarily. Rank-based scoring (position 1, 2, 3...) is always distinct. The ambulance that sorts first by ETA always wins on that dimension, regardless of how similar the actual values are.</p></div>
  <div class="card green"><h3>&#x1F4E6; Zustand over Redux</h3><p><strong>Decision:</strong> Zustand for frontend state management, not Redux or Context API.</p><p><strong>Reason:</strong> Redux requires significant boilerplate (actions, reducers, dispatchers, selectors) for simple state updates. Context API re-renders all consumers on any state change &mdash; bad for the tracking page with ETA updates every 30 seconds. Zustand is minimal (zero boilerplate), supports selective subscriptions (components subscribe to only the slices they need), and integrates cleanly with Socket.io event handlers as plain function calls. The entire state layer is under 150 lines across 3 store files.</p></div>
  <div class="card amber"><h3>&#x1F3AF; BullMQ over Bull</h3><p><strong>Decision:</strong> Migrated to BullMQ (the modern successor to Bull) for the delay detection worker.</p><p><strong>Reason:</strong> Bull uses Redis commands being deprecated in newer Redis versions (Redis 7+). BullMQ is built on Redis Streams, providing better observability, cleaner API, and official long-term maintenance by the original Bull team. The API is more explicit &mdash; <code>const { Queue, Worker } = require('bullmq')</code> separates concerns that Bull combined. Both packages are installed (bull + bullmq in package.json) for compatibility during migration, with BullMQ used for new delay detection implementation.</p></div>
</div>

<!-- FOOTER -->
<div class="doc-footer">
  <p style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:8px">RapidAid &mdash; AI-Powered Emergency Ambulance Dispatch System</p>
  <p>Complete Project Documentation &middot; August 2026 &middot; Shubhanshu Singh &middot; B.Tech CSE (AI/ML) &middot; NITRA Technical Campus</p>
  <p style="margin-top:8px;font-size:12px">React 19 &middot; Vite 8 &middot; Node.js &middot; Socket.io &middot; MongoDB Atlas &middot; Redis/Upstash &middot; Groq LLaMA 3 &middot; BullMQ &middot; Leaflet &middot; JWT &middot; Zustand</p>
  <p style="margin-top:8px;font-size:12px;color:var(--border)">To export as PDF: Open in Chrome &rarr; Ctrl+P &rarr; Save as PDF &rarr; A4, Margins: None</p>
</div>

</body>
</html>"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(HTML)

print(f'Written: {len(HTML)} bytes to {path}')
