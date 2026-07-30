import { RequestHandler, Request, Response, NextFunction } from "express";
import { StatusCode } from "../../../shared/enums/statusCode";
import { sendError, sendResponse, sendSuccess } from "../../../shared/response";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { IAddClientUseCase } from "../../../Application/interface/admin/user/add-client-usecase-interface";
import ISoftDeleteUserUseCase from "../../../Application/interface/admin/user/delete-client-usecase-interface";
import { IEditClientUseCase } from "../../../Application/interface/admin/user/edit-client-usecase-interface";
import { IGetClientByIdUseCase } from "../../../Application/interface/admin/user/get-client-by-id-usecase-interface";
import { IGetClientsUseCase } from "../../../Application/interface/admin/user/get-client-usecase-interface";
import ISearchClientsUseCase from "../../../Application/interface/admin/user/search-client-usecase-interface";
import IUpdateClientStatusUseCase from "../../../Application/interface/admin/user/update-client-status-usecase-interface";

@injectable()
export default class ClientController {
  constructor(
    @inject(TYPES.addClientUsecases) private addClientUseCase : IAddClientUseCase,
    @inject(TYPES.getClientsUsecases) private getClientsUsecases : IGetClientsUseCase,
    @inject(TYPES.editClientUsecases) private editClientUsecases : IEditClientUseCase,
    @inject(TYPES.updateClientSatatusUsecases) private updateClientSatatusUsecases :  IUpdateClientStatusUseCase,
    @inject(TYPES.findClientByIdUsecases) private findClientByIdUsecases : IGetClientByIdUseCase,
    @inject(TYPES.softDeleteUserUsecases) private deleteUserUsecases : ISoftDeleteUserUseCase,
    @inject(TYPES.searchClientUsecases) private searchClientUsecases : ISearchClientsUseCase
  ){}
  
  addClient: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        email,
        clientName,
        attendedDate,
        contactNumber,
        address,
        products
      } = req.body;
     
      if (!products || !Array.isArray(products)) {
        sendError(res, "Products must be an array", StatusCode.BAD_REQUEST);
        return;
      }
      const newClient = await this.addClientUseCase.execute(
        email,
        clientName,
        attendedDate,
        contactNumber,
        address,
        products
      );

      sendSuccess(res, { client: newClient }, newClient ? "Client created/updated successfully" : "Failed to create/update client", StatusCode.CREATED);
    } catch (err: unknown) {
      next(err instanceof Error ? err : new Error("Unknown error occurred"));
   }
  };

  getClients: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { clients, total } = await this.getClientsUsecases.execute({page, limit});
      sendSuccess(res, { clients, total, totalPages: Math.ceil(total / limit), currentPage: page }, "Fetched clients successfully", StatusCode.OK);
    } catch (err: unknown) {
     next(err instanceof Error ? err : new Error("Unknown error occurred"));
   }
  };

  editClient: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.params.ClientId;
      const updateData = req.body;

      if (!clientId) {
        sendError(res, "Client ID is required", StatusCode.BAD_REQUEST);
        return;
      }

      const updatedClient = await this.editClientUsecases.execute(
       { clientId,
        updateData}
      );

      if (!updatedClient) {
        sendError(res, "Client not found", StatusCode.NOT_FOUND);
        return;
      }

      sendSuccess(res, { client: updatedClient }, "Client updated successfully", StatusCode.OK);
      return;
    } catch (err: unknown) {
      next(err);
    }
  };

  updateStatus: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ClientId } = req.params;
      const { status } = req.body;
      const clientId = ClientId
      const success = await this.updateClientSatatusUsecases.execute(
        {clientId,
        status}
      );
      if (!success) {
        sendError(res, "Client not found or status unchanged", StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, null, "Client status updated", StatusCode.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  getClientId: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const client = await this.findClientByIdUsecases.execute(id);
      if (!client) {
        sendError(res, "Client not found", StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, client, "Client retrieved successfully", StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  SoftDeleteUser: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ClientId } = req.params;
      const result = await this.deleteUserUsecases.execute(ClientId);

      if (!result) {
        sendError(res, "User not found or already deleted", StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, null, "User soft deleted successfully", StatusCode.OK);
      return;
    } catch (error: unknown) {
      next(error);
    }
  };

  searchClients: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { searchTerm, status } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { clients, total } = await this.searchClientUsecases.execute(
        searchTerm as string,
        status as string,
        page,
        limit
      );
      sendSuccess(res, { clients, total, totalPages: Math.ceil(total / limit), currentPage: page }, "Searched clients successfully", StatusCode.OK);
    } catch (err: unknown) {
      next(err);
    }
  };
}