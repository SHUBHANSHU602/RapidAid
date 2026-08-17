require('dotenv').config();
const { callGroq, parseGroqJSON } = require('../services/ai/groqService');

async function test() {
  console.log('Test 1: Basic call');
  const raw = await callGroq([
    { role: 'user', content: 'Respond with exactly this JSON and nothing else: { "status": "ok", "message": "Groq working" }' }
  ]);
  console.log('Raw:', raw);

  console.log('\nTest 2: JSON parsing with markdown fences');
  const withFences = '```json\n{ "status": "ok" }\n```';
  const parsed = parseGroqJSON(withFences);
  console.log('Parsed:', parsed);

  console.log('\nTest 3: Rate limiter — 5 rapid calls');
  const calls = Array(5).fill(null).map((_, i) =>
    callGroq([{ role: 'user', content: `Say the number ${i + 1} only` }])
  );
  const results = await Promise.all(calls);
  results.forEach((r, i) => console.log(`Call ${i + 1}:`, r.trim()));

  console.log('\nAll tests passed');
}

test().catch(console.error);