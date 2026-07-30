import { Request, Response, NextFunction } from 'express';
import { ServerError, ValidationError } from '../../../domain/error/employeeErrors';
import { ioInstance } from '../../../app';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendSuccess } from '../../../shared/response';
import { SendVideoCallInvitationsUseCase } from '../../../Application/usecases/videocall/send-videocall-invitasion-usecase';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import FindAdminByIdUseCase from '../../../Application/usecases/admin/find-admin-by-id-usecase';
import { IFindAllCoordinatorsUseCase } from '../../../Application/interface/admin/employee/find-all-coordinator-usecase-interface';
import { IFindAllMechanicsUseCase } from '../../../Application/interface/admin/employee/find-all-mechanic-usecase-interface';
import { IFindAdminByIdUseCase } from '../../../Application/interface/admin/admin/find-admin-by-id-usecase-interface';
import { ISendVideoCallInvitationsUseCase } from '../../../Application/interface/videocall/send-videocall-invitasion-usecase-interface';


@injectable()
export class VideoCallController {
  constructor(
    @inject(TYPES.findAdminByIdUseCase) private findAdminByIDUsecases : IFindAdminByIdUseCase,
    @inject(TYPES.findAllMechanicsUsecases) private findAllMechanicUsecases : IFindAllMechanicsUseCase,
    @inject(TYPES.findAllcoordinatorsUsecases) private findAllCoordinatorUsecases : IFindAllCoordinatorsUseCase,
    @inject(TYPES.SendVideoCallInvitationsUseCase)  private sendInvitationsUseCase :ISendVideoCallInvitationsUseCase
  ){}

  sendInvitations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { callLink, initiatorId, initiatorName: providedInitiatorName } = req.body;
      if (!callLink) {
        throw new ValidationError('Call link is required');
      }
      if (!initiatorId) {
        throw new ValidationError('Initiator ID is required');
      }

      const initiator = await this.findAdminByIDUsecases.execute(initiatorId);
      if (!initiator) {
        throw new ServerError('Initiator not found');
      }

      const initiatorName = providedInitiatorName || initiator.firstName;
      if (!initiatorName) {
        throw new ValidationError('Initiator name is required');
      }

      const mechanics = await this.findAllMechanicUsecases.execute();
      const coordinators = await this.findAllCoordinatorUsecases.execute();
      const activeEmployees = [...mechanics, ...coordinators].filter(
        emp => emp.status === 'active' && !emp.isDeleted
      );

      const result = await this.sendInvitationsUseCase.execute(initiatorId, callLink);

      const roomId = callLink.split('roomID=')[1];
      const participants = activeEmployees.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.employeeName,
        position: emp.position,
      }));

      if (ioInstance) {
        activeEmployees.forEach(recipient => {
          ioInstance!.to(`user_${recipient.id}`).emit('new_video_call', {
            callLink,
            initiatorId,
            initiatorName,
            timestamp: new Date().toISOString(),
          });
          ioInstance!.to(`role_${recipient.position.toLowerCase()}`).emit('new_video_call', {
            callLink,
            initiatorId,
            initiatorName,
            timestamp: new Date().toISOString(),
          });
        });
      }

      sendSuccess(res, {
        data: result,
        adminName: initiatorName,
        participants,
      }, 'Video call invitations sent successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };
}