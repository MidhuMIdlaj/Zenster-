

 export const TYPES ={
     
    // -------------------- Repositories --------------------
    IAdminRepository: Symbol.for("IAdminRepository"),
    IEmployeeRepository: Symbol.for("IEmployeeRepository"),
    IChatRepository: Symbol.for("IChatRepository"),
    INotificationRepository: Symbol.for("INotificationRepository"),
    IUserRepository: Symbol.for("IUserRepository"),
    IComplaintRepository: Symbol.for("IComplaintRepository"),
    IVideoCallRepository: Symbol.for("IVideoCallRepository"),
    IEmailService : Symbol.for("IEmailService"),
    IChatAttachMent : Symbol.for("IChatAttachMent"),
    IComplaintAttachMent : Symbol.for("IComplaintAttachMent"),

    // -------------------- Services --------------------
    EmailService: Symbol.for("EmailService"),
    NotificationService: Symbol.for("NotificationService"),
    TokenService: Symbol.for("TokenService"),
    ChatAttachmentUploader: Symbol.for("ChatAttachmentUploader"),
    ComplaintAttachmentUploader : Symbol.for("ComplaintAttachmentUploader"),
    ComplaintReassignmentScheduler : Symbol.for("ComplaintReassignmentScheduler"),
    


    // -------------------- Use Cases --------------------
    // Admin
    adminAuthUseCase: Symbol.for("adminAuthUseCase"),
    AdminResetPasswordRequestUseCase: Symbol.for("resetPasswordRequestUseCase"),
    AdminResetPasswordUseCase: Symbol.for("resetPasswordUseCase"),
    updateProfileUseCase: Symbol.for("updateProfileUseCase"),
    findAdminByIdUseCase: Symbol.for("findAdminByIdUseCase"),
    getAllAdminsUseCase: Symbol.for("getAllAdminsUseCase"),
    findAdminNameUsecases : Symbol.for("findAdminNameUsecases"),

    //Employee
    addEmployeeUsecases : Symbol.for("addEmployeeUsecases"),
    getEmployeesUsecases : Symbol.for("getEmployeesUsecases"),
    dleEmployeeUsecases : Symbol.for("DeleEmployeeUsecases"),
    updateEmployeeProfileUsecases : Symbol.for("updateEmployeeProfileUsecases"),
    editEmployeeUsecases : Symbol.for("EditEmployeeUsecases"),
    findEmployeeByIdUsecases : Symbol.for("findEmployeeByIdUsecases"),
    employeeStatusUsecases : Symbol.for("EmployeeStatusUsecases"),
    getEmployeeProfileUsecases : Symbol.for("getEmployeeProfileUsecases"),
    loginEmployeeUsecases : Symbol.for("LoginEmployeeUsecases"),
    employeeResetPasswordUsecases : Symbol.for("ResetPasswordUsecases"),
    employeeResetPasswordRequestUsecases : Symbol.for("ResetPasswordRequestUsecases"),
    searchEmployeeUsecases : Symbol.for("SearchEmployeeUsecases"),
    getCoordinatorEmails : Symbol.for("getCoordinatorEmails"),
    findBestMechanicUsecase : Symbol.for("findBestMechanicUsecase"),
    findAllcoordinatorsUsecases : Symbol.for("findAllcoordinatorsUsecases"),
    findAllMechanicsUsecases : Symbol.for("findAllMechanicsUsecases"),

    //User 
    addClientUsecases: Symbol.for("addClientUsecases"),
    searchClientUsecases: Symbol.for("searchClientUsecases"),
    softDeleteUserUsecases: Symbol.for("softDeleteUserUsecases"),
    editClientUsecases : Symbol.for("editClientUsecases"),
    getClientsUsecases : Symbol.for("getClientsUsecases"),
    findClientByIdUsecases : Symbol.for("findClientByIdUsecases"),
    updateClientSatatusUsecases : Symbol.for("updateClientStatusUsecases"),
    getCustomerEmailsUsecases : Symbol.for("getCustomerEmailsUsecases"),
    
    //Chat 
    getChatHistoryUseCase: Symbol.for("getChatHistoryUseCase"),
    getConversationsUsecase: Symbol.for("getConversationsUseCase"),
    MarkMessagesAsReadUseCase: Symbol.for("MarkMessagesAsReadUseCase"),
    saveMessageUseCase: Symbol.for("saveMessageUseCase"),
    
    //Notification 
    GetNotificationsForUserUseCase : Symbol.for("GetNotificationsForUserUseCase"),
    GetUnreadChatNotificationsUseCase: Symbol.for("GetUnreadChatNotificationsUseCase"),
    MarkAllChatNotificationsAsReadUseCase : Symbol.for("MarkAllChatNotificationsAsReadUseCase"),
    MarkChatNotificationAsReadUseCase : Symbol.for("MarkChatNotificationAsReadUseCase"),
    MarkNotificationAsReadUseCase : Symbol.for("MarkNotificationAsReadUseCase"),

    // Video Call 
    CreateVideoCallRecordUseCase : Symbol.for("CreateVideoCallRecordUseCase"),
    EndVideoCallUseCase : Symbol.for("EndVideoCallUseCase"),
    GetCallHistoryUseCase : Symbol.for("GetCallHistoryUseCase"),
    SendVideoCallInvitationsUseCase : Symbol.for("SendVideoCallInvitationsUseCase"),
    UpdateCallParticipantsUseCase : Symbol.for("UpdateCallParticipantsUseCase"),
   
    //Common 
    acceptComplaintUseCase: Symbol.for("acceptComplaintUseCase"),
    assignComplaintUseCase: Symbol.for("AssignComplaintUseCase"),
    completeTaskUseCase: Symbol.for("CompleteTaskUseCase"),
    createComplaintUseCase: Symbol.for("CreateComplaintUseCase"),
    deleteComplaintUseCase: Symbol.for("DeleteComplaintUseCase"),
    getAllComplaintsUseCase: Symbol.for("GetAllComplaintsUseCase"),
    changeStatusUseCase: Symbol.for("ChangeStatusUseCase"),
    getMechanicComplaintUseCase: Symbol.for("getMechanicComplaintUseCase"),
    validateAdminCoordinatorUseCase: Symbol.for("ValidateAdminCoordinatorUseCase"),
    getAvailableMechanicUseCase: Symbol.for("GetAvailableMechanicUseCase"),
    updateComplaintStatusUsecase : Symbol.for("UpdateComplaintStatusUsecase"),
    GetComplaintsAssignedToMechanic : Symbol.for("GetComplaintsAssignedToMechanic"),
    getComplaintByIdUsecase : Symbol.for("GetComplaintByIdUsecase"),
    rejectComplaintUsecase : Symbol.for("RejectComplaintUsecase"),
    findCustomerByEmailUseCase: Symbol.for("FindCustomerByEmailUseCase"),

    // -------------------- Controllers --------------------
    //Admin Controllers
    AuthController: Symbol.for("AuthController"),
    ClientController: Symbol.for("ClientController"),
    EmployeeController: Symbol.for("EmployeeController"),
    //Common Controllers
    ComplaintController: Symbol.for("ComplaintController"),
    VideoCallController: Symbol.for("VideoCallController"),
    ChatController: Symbol.for("ChatController"),
    NotificationController: Symbol.for("NotificationController"),
    VideoCallHistoryController: Symbol.for("VideoCallHistoryController"),
    // Employee Controllers
    EmployeeAuthController: Symbol.for("EmployeeAuthController"),



    //Middleware
    authMiddleware: Symbol.for("authMiddleware"),
    errorMiddleware: Symbol.for("errorMiddleware"),
    asyncHandler: Symbol.for("asyncHandler"),
 }
