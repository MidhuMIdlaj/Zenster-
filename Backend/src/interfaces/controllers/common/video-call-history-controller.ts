// src/controllers/videoCall/VideoCallHistoryController.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendSuccess } from '../../../shared/response';
import {  ValidationError } from '../../../domain/error/employeeErrors';
import { VideoCallHistoryInput } from '../../../infrastructure/db/models/videocall.history.model';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import { IFindAdminNameUseCase } from '../../../Application/interface/admin/admin/find-all-admin-name-usecase-interface';
import { ICreateVideoCallRecordUseCase } from '../../../Application/interface/videocall/create-videocall-record-usecase-interface';
import { IEndVideoCallUseCase } from '../../../Application/interface/videocall/end-videocall-usecase-interface';
import { IGetCallHistoryUseCase } from '../../../Application/interface/videocall/get-call-history-usecase-interface';
import { IUpdateCallParticipantsUseCase } from '../../../Application/interface/videocall/update-call-participens-usecase-inerface';

@injectable()
export class VideoCallHistoryController {
  constructor(
    @inject(TYPES.CreateVideoCallRecordUseCase) private createCallRecordUseCase : ICreateVideoCallRecordUseCase,
    @inject(TYPES.UpdateCallParticipantsUseCase) private updateParticipantsUseCase : IUpdateCallParticipantsUseCase,
    @inject(TYPES.EndVideoCallUseCase) private endCallUseCase : IEndVideoCallUseCase,
    @inject(TYPES.GetCallHistoryUseCase) private getCallHistoryUseCase : IGetCallHistoryUseCase,
    @inject(TYPES.findAdminNameUsecases) private findAdminNameUsecases : IFindAdminNameUseCase
  ) {}

  createCallRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId,initiatorId, participants } = req.body;

    if (!roomId) {
      throw new ValidationError('Room ID is required');
    }
    const initiator = await this.findAdminNameUsecases.execute(initiatorId);
    const initiatorName = typeof initiator === 'string'
      ? initiator
      : initiator && typeof initiator === 'object' && 'name' in initiator
        ? (initiator as { name: string }).name
        : 'admin';
    const callRecord: VideoCallHistoryInput = {
      roomId,
      initiatorId,
      initiatorName,
      participants: participants || [],
      startedAt: new Date(),
      status: 'ongoing'
    };

    const createdRecord = await this.createCallRecordUseCase.execute(callRecord);

    sendSuccess(res, createdRecord, 'Video call record created successfully', StatusCode.CREATED);
        } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'A call with this room ID already exists') {
          return next(new ValidationError(error.message));
        }
      }

      if (
        typeof error === 'object' &&
        error !== null
      ) {
        const e = error as Record<string, unknown>;
        if (e['name'] === 'MongoServerError' && (e['code'] as number) === 11000) {
          return next(new ValidationError('Duplicate key error - room ID must be unique'));
        }
      }

      return next(error);
      }
  }


  updateParticipants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { participants } = req.body;

    if (!roomId || !Array.isArray(participants)) {
      throw new ValidationError('roomId and participants array are required');
    }

    const updatedRecord = await this.updateParticipantsUseCase.execute(roomId, participants);

    sendSuccess(res, updatedRecord, 'Participants updated successfully', StatusCode.OK);
  } catch (error) {
    next(error);
  }
};

 endCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      throw new ValidationError('Room ID is required');
    }

    const call = await this.endCallUseCase.execute(roomId);
    if (!call) {
      throw new ValidationError('Call not found');
    }

    if (call.status === 'ended') {
       sendSuccess(res, call, 'Call already ended', StatusCode.OK);
      return
    }

    const endedAt = new Date();
    const startedAt = call.startedAt || new Date();

    const durationInSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    call.endedAt = endedAt;
    call.status = 'ended';
    call.duration = durationInSeconds;

    const updatedCall = await call.save();
    sendSuccess(res, updatedCall, 'Call ended successfully', StatusCode.OK);
  } catch (error) {
    next(error);
  }
};

  getCallHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
     const histories = await this.getCallHistoryUseCase.execute()
      sendSuccess(res, histories, 'Video call history retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };
}