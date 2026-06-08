import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../plugins/authenticate";
import menuController from "../controllers/menuController";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";

const adminGuard = { preHandler: [authenticate, requireRole("ADMIN")] };

const menuRoutes = async (app: FastifyInstance) => {
  app.get("/menus", menuController.listPublic);

  app.get("/admin/menus", adminGuard, menuController.list);

  app.post<{ Body: CreateMenuDto }>(
    "/admin/menus",
    adminGuard,
    menuController.create,
  );

  app.put<{ Params: { id: string }; Body: UpdateMenuDto }>(
    "/admin/menus/:id",
    adminGuard,
    menuController.update,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/menus/:id",
    adminGuard,
    menuController.delete,
  );
};
export default menuRoutes;
