import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../plugins/authenticate";
import {
  createMenuHandler,
  deleteMenuHandler,
  getMenusHandler,
  getPublicMenusHandler,
  updateMenuHandler,
} from "../controllers/menuController";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";

const adminGuard = { preHandler: [authenticate, requireRole("ADMIN")] };

export default async function menuRoutes(app: FastifyInstance) {
  app.get("/menus", getPublicMenusHandler);

  app.get("/admin/menus", adminGuard, getMenusHandler);

  app.post<{ Body: CreateMenuDto }>("/admin/menus", adminGuard, createMenuHandler);

  app.put<{ Params: { id: string }; Body: UpdateMenuDto }>(
    "/admin/menus/:id",
    adminGuard,
    updateMenuHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/menus/:id",
    adminGuard,
    deleteMenuHandler,
  );
}
