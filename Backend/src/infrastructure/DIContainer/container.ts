import { Container } from 'inversify';
import { TYPES } from '../../types';

import { IAdminRepository } from '../../domain/Repository/i-admin-repository';
import { AdminRepoImplement } from '../repositories/admin-repository';
import { IChatRepository } from '../../domain/Repository/i-chat-repository';
import { ChatRepositoryImplement } from '../repositories/chat-repository';
import ComplaintRepository from '../../domain/Repository/i-complaint-repository';
import ComplaintRepoImpl from '../repositories/complaint-repository';
import EmployeeRepository from '../../domain/Repository/i-employee-repository';
import EmployeeRepoImpl from '../repositories/employee-repository';
import { INotificationRepository } from '../../domain/Repository/i-notification-repository';
import { NotificationRepository } from '../Services/notification-service';
import IUserRepository from '../../domain/Repository/i-user-repository';
import UserRepoImpl from '../repositories/user-repository';
import { IVideoCallHistoryRepository } from '../../domain/Repository/i-videocall-history-repository';
import { VideoCallHistoryRepoImpl } from '../repositories/videocall-history-repository';
import { AddEmployeeUseCase } from '../../Application/usecases/admin/Employee/add-employee-usecase';
import { EditEmployeeUseCase } from '../../Application/usecases/admin/Employee/edit-employee-usecase';
import { SoftDeleteEmployeeUseCase } from '../../Application/usecases/admin/Employee/delete-employee-usecase';
import GetEmployeeProfileUseCase from '../../Application/usecases/admin/Employee/get-employee-profile-usecase';
import { SearchEmployeesUseCase } from '../../Application/usecases/admin/Employee/search-employee-usecase';
import UpdateEmployeeProfileUseCase from '../../Application/usecases/admin/Employee/update-employee-profile-usecase';
import { AddClientUseCase } from '../../Application/usecases/admin/Users/add-client-usecase';
import { SoftDeleteUserUseCase } from '../../Application/usecases/admin/Users/delete-client-usecase';
import { EditClientUseCase } from '../../Application/usecases/admin/Users/edit-client-usecase';
import { GetClientByIdUseCase } from '../../Application/usecases/admin/Users/get-client-by-id-usecase';
import { GetClientsUseCase } from '../../Application/usecases/admin/Users/get-client-usecase';
import GetCustomerEmails from '../../Application/usecases/admin/Users/get-customer-email-usecase';
import { SearchClientsUseCase } from '../../Application/usecases/admin/Users/search-client-usecase';
import { UpdateClientStatusUseCase } from '../../Application/usecases/admin/Users/update-client-status-usecase';
import LoginAdminUseCase from '../../Application/usecases/admin/admin-auth-usecase';
import FindAdminByIdUseCase from '../../Application/usecases/admin/find-admin-by-id-usecase';
import GetAllAdminsUseCase from '../../Application/usecases/admin/get-all-admin-usecase';
import ResetPasswordRequestUseCase from '../../Application/usecases/admin/reset-password-request-usecase';
import UpdateProfileUseCase from '../../Application/usecases/admin/update-profile-usecase';
import ResetPasswordUseCase from '../../Application/usecases/admin/reset-password-usecase';
import GetChatHistoryUseCase from '../../Application/usecases/chat/get-history-usecase';
import GetConversationsUseCase from '../../Application/usecases/chat/get-conversation-usecase';
import MarkMessagesAsReadUseCase from '../../Application/usecases/chat/mark-message-as-read-usecase';
import SaveMessageUseCase from '../../Application/usecases/chat/save-message-usecase';
import { AcceptComplaint } from '../../Application/usecases/common/accept-complaint-usecase';
import AssignComplaintUseCase from '../../Application/usecases/common/assigned-complaint-usecase';
import { ChangeStatusUseCase } from '../../Application/usecases/common/change-status-usecase';
import CompleteTaskUseCase from '../../Application/usecases/common/complete-task-usecase';
import { DeleteComplaintUseCase } from '../../Application/usecases/common/delete-complaint-usecase';
import { FindCustomerByEmailUseCase } from '../../Application/usecases/common/find-customer-by-emial-usecase';
import GetAllComplaintsUseCase from '../../Application/usecases/common/get-all-complaint-usecase';
import { GetAvailableMechanics } from '../../Application/usecases/common/get-available-mechanic-usecase';
import GetComplaintByIdUseCase from '../../Application/usecases/common/get-complaint-by-id-usecase';
import GetComplaintsAssignedToMechanic from '../../Application/usecases/common/get-complaint-by-mechanic-id-usecase';
import { GetMechanicComplaint } from '../../Application/usecases/common/get-mechanic-complaint-usecase';
import { RejectComplaintUseCase } from '../../Application/usecases/common/reject-complaint-usecase';
import UpdateComplaintStatusUseCase from '../../Application/usecases/common/update-complaint-status';
import { ValidateAdminCoordinator } from '../../Application/usecases/common/validate-admin-coordinator-email-usecase';
import GetCoordinatorEmails from '../../Application/usecases/employee/get-coordinator-email-usecase';
import LoginEmployeeUseCase from '../../Application/usecases/employee/login-employee-usecase';
import { GetNotificationsForUserUseCase } from '../../Application/usecases/notification/get-notification-for-user-usecase';
import GetUnreadChatNotificationsUseCase from '../../Application/usecases/notification/get-unread-chat-notification-usecase';
import { markAllChatNotificationsAsRead } from '../../Application/usecases/notification/mark-all-chat-notification-as-read-usecase';
import { MarkChatNotificationAsReadUseCase } from '../../Application/usecases/notification/mark-chat-notification-read-usecase';
import { MarkNotificationAsReadUseCase } from '../../Application/usecases/notification/mark-notification-as-read-usecase';
import { CreateVideoCallRecordUseCase } from '../../Application/usecases/videocall/create-video-call-record-usecase';
import { EndVideoCallUseCase } from '../../Application/usecases/videocall/end-videocall-usecase';
import GetCallHistoryUseCase from '../../Application/usecases/videocall/get-call-history-usecase';
import { SendVideoCallInvitationsUseCase } from '../../Application/usecases/videocall/send-videocall-invitasion-usecase';
import UpdateCallParticipantsUseCase from '../../Application/usecases/videocall/update-call-participents-usecase';
import AdminController from '../../interfaces/controllers/admin/admin-auth-controller';
import ClientController from '../../interfaces/controllers/admin/client-controller';
import EmployeeController from '../../interfaces/controllers/admin/employee-controller';
import { ChatController } from '../../interfaces/controllers/common/chat-controller';
import ComplaintController from '../../interfaces/controllers/common/complaint-controller';
import { NotificationController } from '../../interfaces/controllers/common/notification-controller';
import { VideoCallHistoryController } from '../../interfaces/controllers/common/video-call-history-controller';
import { VideoCallController } from '../../interfaces/controllers/common/video-call-controller';
import EmployeeAuthController from '../../interfaces/controllers/employee/employee-auth-controller';
import { MulterConfig } from '../Services/multer-service';
import { FindBestMechanicUseCase } from '../../Application/usecases/employee/find-best-mechanic-usecase';
import { EmailService } from '../Services/nodemailer-service';
import { ChatAttachmentUploader } from '../Services/s3-uploads-service';
import { ComplaintReassignmentScheduler } from '../Services/scheduler-service';
import { ComplaintAttachmentUploader } from '../Services/s3-credential-service';
import { FindAdminNameUseCase } from '../../Application/usecases/admin/find-all-admin-name-usecase';
import { FindAllCoordinatorsUseCase } from '../../Application/usecases/admin/Employee/find-all-coordinator-usecase';
import { FindAllMechanicsUseCase } from '../../Application/usecases/admin/Employee/find-all-mechanic-usecase';
import { IEmailService } from '../../domain/Repository/i-email-repository';
import { IChatAttachmentUploaderRepository } from '../../domain/Repository/i-chat-attachment-upload-repository';
import { IComplaintAttachmentRepository } from '../../domain/Repository/i-complaint-attachment-upload-repository';
import { GetAllEmployeesUseCase } from '../../Application/usecases/admin/Employee/get-all-employee-usecase';
import { CreateComplaintUseCase } from '../../Application/usecases/common/create-complaint-usecase';
import { IAddEmployeeUseCase } from '../../Application/interface/admin/employee/add-employee-usecase-interface';
import { ISoftDeleteEmployeeUseCase } from '../../Application/interface/admin/employee/delete-employee-usecase-interface';
import { IEditEmployee } from '../../Application/interface/admin/employee/edit-employee-usecase-interface';
import { IFindAllCoordinatorsUseCase } from '../../Application/interface/admin/employee/find-all-coordinator-usecase-interface';
import { IFindAllMechanicsUseCase } from '../../Application/interface/admin/employee/find-all-mechanic-usecase-interface';
import { IGetAllEmployeesUseCase } from '../../Application/interface/admin/employee/get-all-employee-usecase-interface';
import IGetEmployeeProfileUseCase from '../../Application/interface/admin/employee/get-employee-profile-usecase-interface';
import ISearchEmployeesUseCase from '../../Application/interface/admin/employee/search-employee-usecase-interface';
import { IUpdateEmployeeProfileUseCase } from '../../Application/interface/admin/employee/update-employee-profile-usecase-interface';
import { IAddClientUseCase } from '../../Application/interface/admin/user/add-client-usecase-interface';
import ISoftDeleteUserUseCase from '../../Application/interface/admin/user/delete-client-usecase-interface';
import { IEditClientUseCase } from '../../Application/interface/admin/user/edit-client-usecase-interface';
import { IGetClientByIdUseCase } from '../../Application/interface/admin/user/get-client-by-id-usecase-interface';
import { IGetClientsUseCase } from '../../Application/interface/admin/user/get-client-usecase-interface';
import ISearchClientsUseCase from '../../Application/interface/admin/user/search-client-usecase-interface';
import IUpdateClientStatusUseCase from '../../Application/interface/admin/user/update-client-status-usecase-interface';
import { ILoginAdminUseCase } from '../../Application/interface/admin/admin/admin-auth-usecase-interface';
import { IFindAdminByIdUseCase } from '../../Application/interface/admin/admin/find-admin-by-id-usecase-interface';
import { IFindAdminNameUseCase } from '../../Application/interface/admin/admin/find-all-admin-name-usecase-interface';
import { IGetAllAdminsUseCase } from '../../Application/interface/admin/admin/get-all-admin-usecase-interface';
import { IResetPasswordRequestUseCase } from '../../Application/interface/admin/admin/reset-password-request-usecase-interface';
import { IResetPasswordUseCase } from '../../Application/interface/admin/admin/reset-password-usecase-interface';
import { IUpdateProfileUseCase } from '../../Application/interface/admin/admin/update-profile-usecase-interface';
import { IGetConversationsUseCase } from '../../Application/interface/chat/get-conversation-usecase-interface';
import { IGetChatHistoryUseCase } from '../../Application/interface/chat/get-history-usecase-interface';
import { IMarkMessagesAsReadUseCase } from '../../Application/interface/chat/mark-message-as-read-usecase-interface';
import { ISaveMessageUseCase } from '../../Application/interface/chat/save-message-usecase-interface';
import { IAcceptComplaintUseCase } from '../../Application/interface/common/accept-complaint-usecase-interface';
import { IChangeStatusUseCase } from '../../Application/interface/common/change-status-usecase-interface';
import { ICompleteTaskUseCase } from '../../Application/interface/common/complete-task-usecase-interface';
import { ICreateComplaintUseCase } from '../../Application/interface/common/create-complaint-usecase-interface';
import IDeleteComplaintUseCase from '../../Application/interface/common/delete-complaint-usecase-interface';
import IFindCustomerByEmailUseCase from '../../Application/interface/common/find-customer-by-email-usecase-interface';
import IGetAllComplaintsUseCase from '../../Application/interface/common/get-all-complaint-usecase-interface';
import IGetAvailableMechanicsUseCase from '../../Application/interface/common/get-available-mechanic-usecase-interface';
import IGetComplaintByIdUseCase from '../../Application/interface/common/get-complaint-by-id-usecase-interface';
import IGetComplaintsAssignedToMechanicUseCase from '../../Application/interface/common/get-complaint-by-mechanic-id-usecase-interface';
import IGetMechanicComplaintUseCase from '../../Application/interface/common/get-mechanic-complaint-usecase-interface';
import { IRejectComplaintUseCase } from '../../Application/interface/common/reject-complaint-usecase-interface';
import { IUpdateComplaintStatusUseCase } from '../../Application/interface/common/update-complaint-status-usecase-interface';
import { IValidateAdminCoordinatorUseCase } from '../../Application/interface/common/validate-admin-coordinator-email-usecase-interface';
import { IFindBestMechanicUseCase } from '../../Application/interface/employee/find-best-mechanic-usecase-interface';
import { IGetCoordinatorEmails } from '../../Application/interface/employee/get-coordinator-email-usecase-interface';
import { IGetCustomerEmails } from '../../Application/interface/admin/user/get-customer-email-usecase';
import ILoginEmployeeUseCase from '../../Application/interface/employee/login-employee-usecase-interface';
import {IResetPasswordRequestEmployeeUseCase} from '../../Application/interface/employee/reset-password-request-usecase-inetrface'
import { IResetPasswordEmployeeUseCase } from '../../Application/interface/employee/reset-password-usecase-interface';
import ResetPasswordAdminUseCase from '../../Application/usecases/admin/reset-password-usecase';
import ResetPasswordRequestAdminUseCase from '../../Application/usecases/admin/reset-password-request-usecase';
import ResetPasswordRequestEmployeeUseCase from '../../Application/usecases/employee/reset-password-request-usecase';
import ResetPasswordEmployeeUseCase from '../../Application/usecases/employee/reset-password-usecase';
import { IGetNotificationsForUserUseCase } from '../../Application/interface/notification/get-notification-for-user-usecase-interface';
import { IGetUnreadChatNotificationsUseCase } from '../../Application/interface/notification/get-unread-chat-notification-usecase-interface';
import { IMarkAllChatNotificationsAsReadUseCase } from '../../Application/interface/notification/mark-all-chat-notification-as-read-usecase-interface';
import { IMarkChatNotificationAsReadUseCase } from '../../Application/interface/notification/mark-chat-notification-read-usecase-interface';
import { IMarkNotificationAsReadUseCase } from '../../Application/interface/notification/mark-notification-as-read-usecase-interface';
import { ICreateVideoCallRecordUseCase } from '../../Application/interface/videocall/create-videocall-record-usecase-interface';
import { IEndVideoCallUseCase } from '../../Application/interface/videocall/end-videocall-usecase-interface';
import { IGetCallHistoryUseCase } from '../../Application/interface/videocall/get-call-history-usecase-interface';
import { ISendVideoCallInvitationsUseCase } from '../../Application/interface/videocall/send-videocall-invitasion-usecase-interface';
import { IUpdateCallParticipantsUseCase } from '../../Application/interface/videocall/update-call-participens-usecase-inerface';

const container = new Container();

// Bindings for repositories
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepoImplement).inSingletonScope();
container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepositoryImplement).inSingletonScope();
container.bind<ComplaintRepository>(TYPES.IComplaintRepository).to(ComplaintRepoImpl).inSingletonScope();
container.bind<EmployeeRepository>(TYPES.IEmployeeRepository).to(EmployeeRepoImpl).inSingletonScope();
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepoImpl).inSingletonScope();
container.bind<IVideoCallHistoryRepository>(TYPES.IVideoCallRepository).to(VideoCallHistoryRepoImpl).inSingletonScope();
container.bind<NotificationRepository>(TYPES.INotificationRepository).to(NotificationRepository).inSingletonScope()
container.bind<IEmailService>(TYPES.IEmailService).to(EmailService).inSingletonScope()
container.bind<IChatAttachmentUploaderRepository>(TYPES.IChatAttachMent).to(ChatAttachmentUploader).inSingletonScope()
container.bind<IComplaintAttachmentRepository>(TYPES.IComplaintAttachMent).to(ComplaintAttachmentUploader).inSingletonScope()
 
// Bindings for Use Cases
//Admin Use Cases
// Admin Use Cases(Employee)
// container.bind<AddEmployeeUseCase>(TYPES.addEmployeeUsecases).to(AddEmployeeUseCase)
// container.bind<SoftDeleteEmployeeUseCase>(TYPES.dleEmployeeUsecases).to(SoftDeleteEmployeeUseCase)
// container.bind<EditEmployeeUseCase>(TYPES.editEmployeeUsecases).to(EditEmployeeUseCase)
// container.bind<FindAllCoordinatorsUseCase>(TYPES.findAllcoordinatorsUsecases).to(FindAllCoordinatorsUseCase)
//Admin Use Cases(Cleint)
container.bind<IGetCustomerEmails>(TYPES.getCustomerEmailsUsecases).to(GetCustomerEmails)
// Chat Use Cases
container.bind<IAcceptComplaintUseCase>(TYPES.acceptComplaintUseCase).to(AcceptComplaint)
container.bind<AssignComplaintUseCase>(TYPES.assignComplaintUseCase).to(AssignComplaintUseCase)
container.bind<IChangeStatusUseCase>(TYPES.changeStatusUseCase).to(ChangeStatusUseCase)
container.bind<ICompleteTaskUseCase>(TYPES.completeTaskUseCase).to(CompleteTaskUseCase)
container.bind<ICreateComplaintUseCase>(TYPES.createComplaintUseCase).to(CreateComplaintUseCase)
container.bind<IDeleteComplaintUseCase>(TYPES.deleteComplaintUseCase).to(DeleteComplaintUseCase)
container.bind<IFindCustomerByEmailUseCase>(TYPES.findCustomerByEmailUseCase).to(FindCustomerByEmailUseCase)
container.bind<IGetAllComplaintsUseCase>(TYPES.getAllComplaintsUseCase).to(GetAllComplaintsUseCase);
container.bind<IGetAvailableMechanicsUseCase>(TYPES.getAvailableMechanicUseCase).to(GetAvailableMechanics)
container.bind<IGetComplaintByIdUseCase>(TYPES.getComplaintByIdUsecase).to(GetComplaintByIdUseCase)
container.bind<IGetComplaintsAssignedToMechanicUseCase>(TYPES.GetComplaintsAssignedToMechanic).to(GetComplaintsAssignedToMechanic)
container.bind<IGetMechanicComplaintUseCase>(TYPES.getMechanicComplaintUseCase).to(GetMechanicComplaint)
container.bind<IRejectComplaintUseCase>(TYPES.rejectComplaintUsecase).to(RejectComplaintUseCase)
container.bind<IUpdateComplaintStatusUseCase>(TYPES.updateComplaintStatusUsecase).to(UpdateComplaintStatusUseCase)
container.bind<IValidateAdminCoordinatorUseCase>(TYPES.validateAdminCoordinatorUseCase).to(ValidateAdminCoordinator)
// Employee use cases
container.bind<IGetCoordinatorEmails>(TYPES.getCoordinatorEmails).to(GetCoordinatorEmails);
container.bind<ILoginEmployeeUseCase>(TYPES.loginEmployeeUsecases).to(LoginEmployeeUseCase)
container.bind<IResetPasswordRequestEmployeeUseCase>(TYPES.employeeResetPasswordRequestUsecases).to(ResetPasswordRequestEmployeeUseCase)
container.bind<IResetPasswordEmployeeUseCase>(TYPES.employeeResetPasswordUsecases).to(ResetPasswordEmployeeUseCase)


//Notification use cases 
container.bind<IGetNotificationsForUserUseCase>(TYPES.GetNotificationsForUserUseCase).to(GetNotificationsForUserUseCase)
container.bind<IGetUnreadChatNotificationsUseCase>(TYPES.GetUnreadChatNotificationsUseCase).to(GetUnreadChatNotificationsUseCase)
container.bind<IMarkAllChatNotificationsAsReadUseCase>(TYPES.MarkAllChatNotificationsAsReadUseCase).to(markAllChatNotificationsAsRead)
container.bind<IMarkChatNotificationAsReadUseCase>(TYPES.MarkChatNotificationAsReadUseCase).to(MarkChatNotificationAsReadUseCase)
container.bind<IMarkNotificationAsReadUseCase>(TYPES.MarkNotificationAsReadUseCase).to(MarkNotificationAsReadUseCase)
// Video Call use cases 
container.bind<ICreateVideoCallRecordUseCase>(TYPES.CreateVideoCallRecordUseCase).to(CreateVideoCallRecordUseCase)
container.bind<IEndVideoCallUseCase>(TYPES.EndVideoCallUseCase).to(EndVideoCallUseCase)
container.bind<IGetCallHistoryUseCase>(TYPES.GetCallHistoryUseCase).to(GetCallHistoryUseCase)
container.bind<ISendVideoCallInvitationsUseCase>(TYPES.SendVideoCallInvitationsUseCase).to(SendVideoCallInvitationsUseCase)
container.bind<IUpdateCallParticipantsUseCase>(TYPES.UpdateCallParticipantsUseCase).to(UpdateCallParticipantsUseCase)


//  Use-case interfaces and implementations
// Employee
container.bind<IAddEmployeeUseCase>(TYPES.addEmployeeUsecases).to(AddEmployeeUseCase);
container.bind<IFindBestMechanicUseCase>(TYPES.findBestMechanicUsecase).to(FindBestMechanicUseCase)
container.bind<ISoftDeleteEmployeeUseCase>(TYPES.dleEmployeeUsecases).to(SoftDeleteEmployeeUseCase);
container.bind<IEditEmployee>(TYPES.editEmployeeUsecases).to(EditEmployeeUseCase);
container.bind<IFindAllCoordinatorsUseCase>(TYPES.findAllcoordinatorsUsecases).to(FindAllCoordinatorsUseCase);
container.bind<IFindAllMechanicsUseCase>(TYPES.findAllMechanicsUsecases).to(FindAllMechanicsUseCase)
container.bind<IGetAllEmployeesUseCase>(TYPES.getEmployeesUsecases).to(GetAllEmployeesUseCase)
container.bind<IGetEmployeeProfileUseCase>(TYPES.getEmployeeProfileUsecases).to(GetEmployeeProfileUseCase)
container.bind<ISearchEmployeesUseCase>(TYPES.searchEmployeeUsecases).to(SearchEmployeesUseCase)
container.bind<IUpdateEmployeeProfileUseCase>(TYPES.updateEmployeeProfileUsecases).to(UpdateEmployeeProfileUseCase)

// Client
container.bind<IAddClientUseCase>(TYPES.addClientUsecases).to(AddClientUseCase)
container.bind<ISoftDeleteUserUseCase>(TYPES.softDeleteUserUsecases).to(SoftDeleteUserUseCase)
container.bind<IEditClientUseCase>(TYPES.editClientUsecases).to(EditClientUseCase)
container.bind<IGetClientByIdUseCase>(TYPES.findClientByIdUsecases).to(GetClientByIdUseCase)
container.bind<IGetClientsUseCase>(TYPES.getClientsUsecases).to(GetClientsUseCase)
container.bind<ISearchClientsUseCase>(TYPES.searchClientUsecases).to(SearchClientsUseCase)
container.bind<IUpdateClientStatusUseCase>(TYPES.updateClientSatatusUsecases).to(UpdateClientStatusUseCase)

//admin
container.bind<ILoginAdminUseCase>(TYPES.adminAuthUseCase).to(LoginAdminUseCase)
container.bind<IFindAdminByIdUseCase>(TYPES.findAdminByIdUseCase).to(FindAdminByIdUseCase)
container.bind<IFindAdminNameUseCase>(TYPES.findAdminNameUsecases).to(FindAdminNameUseCase)
container.bind<IGetAllAdminsUseCase>(TYPES.getAllAdminsUseCase).to(GetAllAdminsUseCase)
container.bind<IResetPasswordRequestUseCase>(TYPES.AdminResetPasswordRequestUseCase).to(ResetPasswordRequestAdminUseCase)
container.bind<IResetPasswordUseCase>(TYPES.AdminResetPasswordUseCase).to(ResetPasswordAdminUseCase)
container.bind<IUpdateProfileUseCase>(TYPES.updateProfileUseCase).to(UpdateProfileUseCase)

//chatt
container.bind<IGetConversationsUseCase>(TYPES.getConversationsUsecase).to(GetConversationsUseCase)
container.bind<IGetChatHistoryUseCase>(TYPES.getChatHistoryUseCase).to(GetChatHistoryUseCase)
container.bind<IMarkMessagesAsReadUseCase>(TYPES.MarkMessagesAsReadUseCase).to(MarkMessagesAsReadUseCase)
container.bind<ISaveMessageUseCase>(TYPES.saveMessageUseCase).to(SaveMessageUseCase)


//Controller 
//admin
container.bind<AdminController>(TYPES.AuthController).to(AdminController)
container.bind<ClientController>(TYPES.ClientController).to(ClientController)
container.bind<EmployeeController>(TYPES.EmployeeController).to(EmployeeController)
//common
container.bind<ChatController>(TYPES.ChatController).to(ChatController)
container.bind<ComplaintController>(TYPES.ComplaintController).to(ComplaintController)
container.bind<NotificationController>(TYPES.NotificationController).to(NotificationController)
container.bind<VideoCallHistoryController>(TYPES.VideoCallHistoryController).to(VideoCallHistoryController)
container.bind<VideoCallController>(TYPES.VideoCallController).to(VideoCallController)
//EmployeeAuth
container.bind<EmployeeAuthController>(TYPES.EmployeeAuthController).to(EmployeeAuthController)


// Service
container.bind<EmailService>(TYPES.EmailService).to(EmailService)
container.bind<NotificationRepository>(TYPES.NotificationService).to(NotificationRepository)
container.bind<ChatAttachmentUploader>(TYPES.ChatAttachmentUploader).to(ChatAttachmentUploader),
container.bind<ComplaintAttachmentUploader>(TYPES.ComplaintAttachmentUploader).to(ComplaintAttachmentUploader)
container.bind<ComplaintReassignmentScheduler>(TYPES.ComplaintReassignmentScheduler).to(ComplaintReassignmentScheduler)

export { container };
