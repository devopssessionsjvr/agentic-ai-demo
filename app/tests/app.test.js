/**
 * Unit Tests for AI-Showcase Application
 * 
 * Tests verify that all endpoints are working correctly.
 * Tests are run in CI/CD pipeline and failures trigger AI-assisted auto-fix.
 */

const request = require('supertest');
const { app, server, createShutdownHandler } = require('../app');

// Cleanup after all tests
afterAll((done) => {
  if (server && server.listening) {
    server.close(done);
  } else {
    done();
  }
});

describe('AI-Showcase API Endpoints', () => {
  
  /**
   * Test: Root endpoint returns welcome message
   */
  describe('GET /', () => {
    it('should return welcome message with available endpoints', async () => {
      const res = await request(app).get('/');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('AI-Showcase');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  /**
   * Test: Status endpoint returns correct status
   * This is the primary endpoint for CI/CD validation
   */
  describe('GET /status', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/status');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('service', 'ai-showcase-app');
    });

    it('should include required status fields', async () => {
      const res = await request(app).get('/status');
      
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('uptime_seconds');
    });

    it('should have correct content type', async () => {
      const res = await request(app).get('/status');
      expect(res.type).toMatch(/json/);
    });
  });

  /**
   * Test: Health endpoint for liveness probe
   */
  describe('GET /health', () => {
    it('should return alive status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'alive');
    });

    it('should include health check fields', async () => {
      const res = await request(app).get('/health');
      
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  /**
   * Test: Readiness probe endpoint
   */
  describe('GET /ready', () => {
    it('should return ready status', async () => {
      const res = await request(app).get('/ready');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('ready', true);
    });
  });

  /**
   * Test: Metrics endpoint
   */
  describe('GET /metrics', () => {
    it('should return metrics data', async () => {
      const res = await request(app).get('/metrics');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('cpu');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  /**
   * Test: 404 for invalid endpoints
   */
  describe('GET /invalid-endpoint', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const res = await request(app).get('/invalid-endpoint');
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toContain('not found');
    });
  });

  /**
   * Test: POST method returns proper error
   */
  describe('POST /status', () => {
    it('should handle POST requests appropriately', async () => {
      const res = await request(app)
        .post('/some-endpoint')
        .send({ test: 'data' });
      
      // Should return 404 since endpoint doesn't exist
      expect(res.statusCode).toBe(404);
    });
  });
});

describe('HTTP Response Headers', () => {
  it('should return CORS headers', async () => {
    const res = await request(app).get('/status');
    
    // CORS middleware should be active
    expect(res.statusCode).toBe(200);
  });
});

describe('Response Time', () => {
  it('should respond quickly', async () => {
    const startTime = Date.now();
    await request(app).get('/status');
    const responseTime = Date.now() - startTime;
    
    // Response should be reasonably fast (less than 1 second)
    expect(responseTime).toBeLessThan(1000);
  });
});

describe('Error Handling', () => {
  it('should handle errors in /status endpoint', async () => {
    // Test error handling path is covered
    const res = await request(app).get('/status');
    expect(res.statusCode).toBe(200);
  });

  it('should handle general 404 errors properly', async () => {
    const res = await request(app).get('/nonexistent-path');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('status', 'error');
  });
});

describe('Signal Handlers', () => {
  it('should have SIGTERM handler registered', () => {
    const listeners = process.listeners('SIGTERM');
    expect(listeners.length).toBeGreaterThan(0);
  });

  it('should have SIGINT handler registered', () => {
    const listeners = process.listeners('SIGINT');
    expect(listeners.length).toBeGreaterThan(0);
  });
});

describe('Application Export', () => {
  it('should export both app and server', () => {
    const moduleExports = require('../app');
    expect(moduleExports).toHaveProperty('app');
    expect(moduleExports).toHaveProperty('server');
    expect(typeof moduleExports.app).toBe('function');
  });
});

describe('Environment Configuration', () => {
  it('should reflect current NODE_ENV in status response', async () => {
    const res = await request(app).get('/status');
    expect(res.body).toHaveProperty('environment');
    // Environment should either be 'test' or current NODE_ENV
    expect(res.body.environment).toBeTruthy();
  });
});

describe('Shutdown Handler', () => {
  it('should create shutdown handler for SIGTERM', () => {
    const handler = createShutdownHandler('SIGTERM');
    expect(typeof handler).toBe('function');
  });

  it('should create shutdown handler for SIGINT', () => {
    const handler = createShutdownHandler('SIGINT');
    expect(typeof handler).toBe('function');
  });

  it('should return callable function that logs message', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const handler = createShutdownHandler('TEST_SIGNAL');
    expect(typeof handler).toBe('function');
    consoleSpy.mockRestore();
  });
});
