import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../plugins/authenticate";
import menuController from "../controllers/menuController";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";

const adminGuard = { preHandler: [authenticate, requireRole("ADMIN")] };

export default async function menuRoutes(app: FastifyInstance) {
  app.get("/menus", menuController.getPublicMenusHandler);

  app.get("/admin/menus", adminGuard, menuController.getMenusHandler);

  app.post<{ Body: CreateMenuDto }>(
    "/admin/menus",
    adminGuard,
    menuController.createMenuHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateMenuDto }>(
    "/admin/menus/:id",
    adminGuard,
    menuController.updateMenuHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/menus/:id",
    adminGuard,
    menuController.deleteMenuHandler,
  );
}
