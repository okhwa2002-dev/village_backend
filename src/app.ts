import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import authRoutes from "./routes/authRoutes";
import farmerRoutes from "./routes/farmerRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import villageRoutes from "./routes/villageRoutes";

export default function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret",
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

  app.register(authRoutes, { prefix: "/api" });
  app.register(farmerRoutes, { prefix: "/api" });
  app.register(productRoutes, { prefix: "/api" });
  app.register(cartRoutes, { prefix: "/api" });
  app.register(orderRoutes, { prefix: "/api" });
  app.register(villageRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
