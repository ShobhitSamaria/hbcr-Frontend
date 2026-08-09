import { createApp } from "./app.ts";
import { connectDb, disconnectDb } from "./db/prisma.ts";
import { config } from "./config/index.js";

const app = createApp();

(async () => {
  try {
    await connectDb();
    // eslint-disable-next-line no-console
    console.log("[HBCR] Database connection established");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[HBCR] Failed to connect to the database:", e);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`HBCR Backend running on port ${config.port} (${config.nodeEnv})`);
    // eslint-disable-next-line no-console
    console.log(`Try: curl http://localhost:${config.port}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: NodeJS.Signals) => {
    // eslint-disable-next-line no-console
    console.log(`\n[HBCR] ${signal} received - shutting down...`);
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log("[HBCR] HTTP server closed");
    });
    await disconnectDb();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
