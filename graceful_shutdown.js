// config/resilience/graceful_shutdown.js
export function setupGracefulShutdown(server) {
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    });
  });
}