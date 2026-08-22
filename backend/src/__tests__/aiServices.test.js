require('dotenv').config();

// Mock Groq to simulate it being completely down
jest.mock('../services/ai/groqService', () => ({
  callGroq: jest.fn().mockRejectedValue(new Error('Groq unavailable')),
  parseGroqJSON: jest.fn().mockReturnValue(null),
}));

const { triageEmergency } = require('../services/ai/triageService');
const { generateDelayMessage } = require('../services/ai/delayMessageService');
const { generateFirstAid } = require('../services/ai/firstAidService');
const { generateDriverReplies } = require('../services/ai/driverAssistService');

describe('AI Services — Groq Down Fallbacks', () => {

  test('triageEmergency falls back gracefully for CARDIAC', async () => {
    const result = await triageEmergency('chest pain difficulty breathing', 'CARDIAC');
    expect(result).not.toBeNull();
    expect(result.severity).toBe(5);
    expect(result.confidence).toBe('low');
    expect(result.immediateActions).toHaveLength(3);
  });

  test('triageEmergency falls back gracefully for OTHER', async () => {
    const result = await triageEmergency('something happened', 'OTHER');
    expect(result).not.toBeNull();
    expect(result.severity).toBeGreaterThanOrEqual(1);
    expect(result.severity).toBeLessThanOrEqual(5);
  });

  test('generateDelayMessage falls back gracefully', async () => {
    const mockSession = {
      _id: '64f8a2000000000000000001',
      location: { lat: 25.3176, lng: 82.9739 },
      emergencyType: 'CARDIAC',
      severityLevel: 4,
      eventLog: [],
    };
    const result = await generateDelayMessage(mockSession, 10, 5);
    expect(result).not.toBeNull();
    expect(result.patientMessage).toBeDefined();
    expect(result.patientMessage).toContain('10');
    expect(result.firstAidAction).toBeDefined();
  });

  test('generateFirstAid falls back for severity 4', async () => {
    const result = await generateFirstAid('CARDIAC', 4, 'chest pain');
    expect(result).not.toBeNull();
    expect(result.steps.length).toBeLessThanOrEqual(5);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.warnings).toBeDefined();
    expect(result.estimatedTimeMin).toBeDefined();
  });

  test('generateFirstAid returns null for severity below 4', async () => {
    const result = await generateFirstAid('CARDIAC', 3, 'mild discomfort');
    expect(result).toBeNull();
  });

  test('generateFirstAid returns null for severity 1', async () => {
    const result = await generateFirstAid('OTHER', 1, 'minor issue');
    expect(result).toBeNull();
  });

  test('generateDriverReplies falls back with exactly 3 replies', async () => {
    const result = await generateDriverReplies('How long?', 'CARDIAC', 5);
    expect(result).toHaveLength(3);
    expect(typeof result[0]).toBe('string');
    expect(result[0]).toContain('5');
  });

  test('generateDriverReplies fallback replies are non-empty strings', async () => {
    const result = await generateDriverReplies('Are you coming?', 'TRAUMA', 8);
    result.forEach(reply => {
      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });
  });

});

describe('AI Services — Input Validation', () => {

  // Reset mock for these tests to use real implementation behavior
  beforeEach(() => {
    jest.resetModules();
  });

  test('triageEmergency skips AI for very short description', async () => {
    // Re-require after reset
    const { triageEmergency: realTriage } = require('../services/ai/triageService');
    const result = await realTriage('hi', 'CARDIAC');
    // Should return fallback since description < 5 chars
    expect(result).not.toBeNull();
    expect(result.confidence).toBe('low');
  });

  test('generateFirstAid skips for severity 1', async () => {
    const { generateFirstAid: realFn } = require('../services/ai/firstAidService');
    const result = await realFn('OTHER', 1, 'minor scratch');
    expect(result).toBeNull();
  });

  test('generateFirstAid skips for severity 2', async () => {
    const { generateFirstAid: realFn } = require('../services/ai/firstAidService');
    const result = await realFn('TRAUMA', 2, 'minor fall');
    expect(result).toBeNull();
  });

  test('generateFirstAid skips for severity 3', async () => {
    const { generateFirstAid: realFn } = require('../services/ai/firstAidService');
    const result = await realFn('OTHER', 3, 'feeling unwell');
    expect(result).toBeNull();
  });

});