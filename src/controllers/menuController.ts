import { FastifyReply, FastifyRequest } from "fastify";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";
import menuService from "../services/menuService";
import { errorResponse, successResponse } from "../utils/response";

const getPublicMenusHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  const menus = await menuService.getPublicMenus();
  return reply.send(successResponse(menus));
};

const getMenusHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
  const menus = await menuService.getMenus();
  return reply.send(successResponse(menus, "메뉴 목록"));
};

const createMenuHandler = async (
  req: FastifyRequest<{ Body: CreateMenuDto }>,
  reply: FastifyReply,
) => {
  const menu = await menuService.addMenu(req.body);
  return reply.code(201).send(successResponse(menu, "메뉴 생성"));
};

const updateMenuHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateMenuDto }>,
  reply: FastifyReply,
) => {
  const menu = await menuService.editMenu(req.params.id, req.body);
  if (!menu)
    return reply.code(404).send(errorResponse("메뉴를 찾을 수 없습니다"));
  return reply.send(successResponse(menu, "메뉴 수정"));
};

const deleteMenuHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  await menuService.removeMenu(req.params.id);
  return reply.send(successResponse(null, "메뉴 삭제"));
};

export default {
  getPublicMenusHandler,
  getMenusHandler,
  createMenuHandler,
  updateMenuHandler,
  deleteMenuHandler,
};
