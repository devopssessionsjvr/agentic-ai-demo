/**
 * AI-Showcase Express Application
 * 
 * This is a simple REST API for demonstrating a complete DevOps CI/CD workflow
 * with AI-assisted auto-fixing, Kubernetes deployment, and ArgoCD GitOps.
 * 
 * Features:
 * - Health check endpoint
 * - Status reporting
 * - Graceful shutdown
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

// Middleware setup
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health Check Endpoint
 * Used by Kubernetes liveness and readiness probes
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * Status Endpoint
 * Returns application status and environment information
 * Main endpoint for CI/CD demonstrations
 */
app.get('/status', (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      message: 'AI-Showcase application is running',
      environment: ENV,
      timestamp: new Date().toISOString(),
      service: 'ai-showcase-app',
      version: '1.0.0',
      uptime_seconds: Math.floor(process.uptime()),
      pod_name: process.env.POD_NAME || 'unknown',
      namespace: process.env.NAMESPACE || 'ai-showcase'
    });
  } catch (error) {
    console.error('Error in /status endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Metrics Endpoint
 * Returns application metrics for monitoring and dashboards
 */
app.get('/metrics', (req, res) => {
  res.status(200).json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Ready Endpoint
 * Used by Kubernetes readiness probe during deployments
 */
app.get('/ready', (req, res) => {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * Root Endpoint
 * Welcome message
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to AI-Showcase CI/CD Workflow',
    endpoints: {
      status: '/status',
      health: '/health',
      ready: '/ready',
      metrics: '/metrics'
    }
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path
  });
});

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Server startup
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV}`);
  console.log('Available endpoints:');
  console.log('  - GET /          → Welcome message');
  console.log('  - GET /status    → Application status');
  console.log('  - GET /health    → Health check (liveness probe)');
  console.log('  - GET /ready     → Readiness probe');
  console.log('  - GET /metrics   → Application metrics');
});

/**
 * Graceful shutdown handler factory
 * Creates a signal handler function
 */
function createShutdownHandler(signal) {
  return () => {
    console.log(`${signal} received - shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };
}

process.on('SIGTERM', createShutdownHandler('SIGTERM'));
process.on('SIGINT', createShutdownHandler('SIGINT'));

module.exports = { app, server, createShutdownHandler };
