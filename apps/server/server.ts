import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { dbConfig } from "./config/dbConfig";
import { env } from "./config/envConfig";
import redis from "./config/redis";
import { closeSocketServer, initSocketServer } from "./config/socket";
import { printStartupLog } from "./utils/startupLogger";
dotenv.config();

const SHUTDOWN_TIMEOUT_MS = 30_000;

async function gracefulShutdown(
  server: ReturnType<typeof app.listen>,
  signal: string,
) {
  console.log(`\n[${signal}] Graceful shutdown initiated...`);

  // 1. Stop accepting new connections
  server.close(async () => {
    console.log("HTTP server closed.");

    try {
      //  Close MongoDB connection
      await dbConfig.disconnect();
      console.log("MongoDB disconnected.");
      // Disconnect Redis
      await redis.quit();
      console.log("Redis disconnected.");
      // Close Socket.IO server
      await closeSocketServer();
      console.log("Socket server closed.");

      console.log("Graceful shutdown complete.");
      process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  });

  // Force kill if graceful shutdown takes too long
  setTimeout(() => {
    console.error(
      `Shutdown timeout (${SHUTDOWN_TIMEOUT_MS}ms) exceeded. Forcing exit.`,
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}



async function startServer() {

  process.on("uncaughtException", (error: Error) => {
    console.error("[uncaughtException] Unhandled exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    console.error("[unhandledRejection] Unhandled promise rejection:", reason);
    process.exit(1);
  });

  try {
    await dbConfig.connect();
    console.log("MongoDb connencted Successfully");

    await redis.ping();

    const httpServer = http.createServer(app);
    await initSocketServer(httpServer);
    printStartupLog();
    const server = httpServer.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });

    server.headersTimeout = 60_000;
    server.keepAliveTimeout = 65_000;
    server.requestTimeout = 70_000;

    process.on("SIGINT", () => gracefulShutdown(server, "SIGINT")); // Ctrl+C
    process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM")); // Docker / K8s stop
  } catch (error) {
    console.log("Failed to connect Database");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.log(error);
    }

    process.exit(1);
  }
}

startServer();
