import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import path from "path";
import authRoutes from "./routes/authRoutes";
import farmerRoutes from "./routes/farmerRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import villageRoutes from "./routes/villageRoutes";
import fileRoutes from "./routes/fileRoutes";
import commonCodeRoutes from "./routes/commonCodeRoutes";
import menuRoutes from "./routes/menuRoutes";

export default function buildApp(): FastifyInstance {
  const isDev = process.env.NODE_ENV !== "test";
  const app = Fastify({
    logger: isDev
      ? {
          level: process.env.LOG_LEVEL || "info",
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }
      : false,
  });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "Village Market API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer" },
        },
      },
    },
  });

  app.register(swaggerUi, { routePrefix: "/docs" });

  app.register(multipart);
  app.register(staticFiles, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/files/",
  });

  app.register(authRoutes, { prefix: "/api" });
  app.register(farmerRoutes, { prefix: "/api" });
  app.register(productRoutes, { prefix: "/api" });
  app.register(cartRoutes, { prefix: "/api" });
  app.register(orderRoutes, { prefix: "/api" });
  app.register(villageRoutes, { prefix: "/api" });
  app.register(fileRoutes, { prefix: "/api" });
  app.register(commonCodeRoutes, { prefix: "/api" });
  app.register(menuRoutes, { prefix: "/api" });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(
      { err: error, method: request.method, url: request.url },
      "Unhandled error",
    );
    reply.code(error.statusCode ?? 500).send({
      success: false,
      message: error.message || "서버 오류가 발생했습니다",
    });
  });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
