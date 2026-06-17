import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateMenuDto,
  CreateMenuGroupDto,
  UpdateMenuDto,
  UpdateMenuGroupDto,
} from "../types/menuTypes";
import menuService from "../services/menuService";
import { errorResponse, successResponse } from "../utils/response";
import { Errors, handleError } from "../utils/errors";

const menuController = {
  async listPublic(_req: FastifyRequest, reply: FastifyReply) {
    const menus = await menuService.getPublicMenus();
    return reply.send(successResponse(menus));
  },

  async list(_req: FastifyRequest, reply: FastifyReply) {
    const menus = await menuService.getMenus();
    return reply.send(successResponse(menus, "메뉴 목록"));
  },

  async create(
    req: FastifyRequest<{ Body: CreateMenuDto }>,
    reply: FastifyReply,
  ) {
    const menu = await menuService.addMenu(req.body);
    return reply.code(201).send(successResponse(menu, "메뉴 생성"));
  },

  async update(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateMenuDto }>,
    reply: FastifyReply,
  ) {
    const menu = await menuService.editMenu(req.params.id, req.body);
    if (!menu)
      return reply.code(404).send(errorResponse("메뉴를 찾을 수 없습니다"));
    return reply.send(successResponse(menu, "메뉴 수정"));
  },

  async createGroup(
    req: FastifyRequest<{ Body: CreateMenuGroupDto }>,
    reply: FastifyReply,
  ) {
    try {
      const group = await menuService.addMenuGroup(req.body);
      return reply.code(201).send(successResponse(group, "메뉴 그룹 생성"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async updateGroup(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateMenuGroupDto }>,
    reply: FastifyReply,
  ) {
    try {
      const group = await menuService.editMenuGroup(req.params.id, req.body);
      if (!group) throw Errors.notFound("메뉴 그룹을 찾을 수 없습니다");
      return reply.send(successResponse(group, "메뉴 그룹 수정"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async listGroups(_req: FastifyRequest, reply: FastifyReply) {
    const groups = await menuService.getMenuGroups();
    return reply.send(successResponse(groups));
  },

  async listByGroup(
    req: FastifyRequest<{ Params: { groupId: string } }>,
    reply: FastifyReply,
  ) {
    const menus = await menuService.getMenusByGroupId(req.params.groupId);
    return reply.send(successResponse(menus));
  },

  async delete(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    await menuService.removeMenu(req.params.id);
    return reply.send(successResponse(null, "메뉴 삭제"));
  },
};
export default menuController;
