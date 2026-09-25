import { inject, injectable } from "inversify";
import { IAttachment, IChatRepository } from "../../../domain/Repository/i-chat-repository";
import { TYPES } from "../../../types";
import { IChatAttachmentUploaderRepository } from "../../../domain/Repository/i-chat-attachment-upload-repository";
import { ISavedMessageUsecase, SaveMessageInput } from "../../../domain/dtos/Chat-usecase/save-message-usecase-interface";
import { ISaveMessageUseCase } from "../../interface/chat/save-message-usecase-interface";



@injectable()
export default class SaveMessageUseCase implements ISaveMessageUseCase {
    constructor(
      @inject(TYPES.IChatRepository) private  chatRepo : IChatRepository,
      @inject(TYPES.IChatAttachMent) private  uploadFileToS31 : IChatAttachmentUploaderRepository
    ) {}

  async execute(input: SaveMessageInput):Promise<ISavedMessageUsecase> {
    const {
      senderId,
      receiverId,
      text,
      conversationId,
      senderRole,
      receiverRole,
      messageType,
      files,
      attachments =[]
    } = input;

    if (!senderId || !receiverId || !conversationId || !senderRole || !receiverRole) {
      throw new Error("Missing required fields");
    }

    const uploadedAttachments = [...attachments];
    for (const file of files || []) {
      const url = await this.uploadFileToS31.upload(file);
      uploadedAttachments.push({
        url,
        type: file.mimetype,
        name: file.originalname,
        size: file.size,
      });
    }

    let finalMessageType = messageType || 'text';

    if (uploadedAttachments.length > 0) {
      finalMessageType = 'file';
    } else if (!messageType && text) {
      if (/urgent|asap|immediately|important/i.test(text)) finalMessageType = 'urgent';
      if (/task|todo|action item/i.test(text)) finalMessageType = 'task';
    }

    const savedMessage = await this.chatRepo.saveMessage({
      senderId,
      receiverId,
      text: text || '',
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      messageType: finalMessageType,
      conversationId,
      senderRole,
      receiverRole,
    });

    return savedMessage;
  }
}
