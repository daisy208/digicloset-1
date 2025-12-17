// config/resilience/node_resilience.js
import axios from 'axios';
import CircuitBreaker from 'opossum';
import client from 'prom-client';

// Prometheus metrics
const retryCounter = new client.Counter({
  name: 'node_request_retries_total',
  help: 'Total number of request retries',
});
const circuitStateGauge = new client.Gauge({
  name: 'node_circuit_state',
  help: '0 = closed, 1 = open, 2 = half-open',
});

// Environment configuration
const RETRY_COUNT = parseInt(process.env.RETRY_COUNT || '3');
const BACKOFF_MS = parseInt(process.env.BACKOFF_MS || '1000');
const CIRCUIT_TIMEOUT_SEC = parseInt(process.env.CIRCUIT_TIMEOUT_SEC || '60');

// Circuit breaker configuration
const breakerOptions = {
  timeout: CIRCUIT_TIMEOUT_SEC * 1000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

const breaker = new CircuitBreaker(async (config) => {
  return axios(config);
}, breakerOptions);

breaker.on('open', () => circuitStateGauge.set(1));
breaker.on('halfOpen', () => circuitStateGauge.set(2));
breaker.on('close', () => circuitStateGauge.set(0));

// Resilient request function
export async function resilientRequest(config) {
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
    try {
      return await breaker.fire(config);
    } catch (err) {
      retryCounter.inc();
      if (attempt < RETRY_COUNT) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS));
      } else {
        throw err;
      }
    }
  }
}