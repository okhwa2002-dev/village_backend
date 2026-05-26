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

export default function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
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

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
