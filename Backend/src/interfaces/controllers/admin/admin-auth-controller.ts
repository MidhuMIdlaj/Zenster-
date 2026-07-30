import { Request, Response } from "express";
import ResetPasswordRequestUseCase from "../../../Application/usecases/admin/reset-password-request-usecase"
import ResetPasswordUseCase from "../../../Application/usecases/admin/reset-password-usecase";
import { AdminModel } from "../../../infrastructure/db/models/Admin/admin.model";
import Employee from "../../../infrastructure/db/models/employee.model";
const jwt = require("jsonwebtoken");
import dotenv from 'dotenv';
import { generateAccessToken } from "../../../middleware/auth-middleware";
import { StatusCode } from "../../../shared/enums/statusCode";
import { sendError, sendResponse, sendSuccess } from "../../../shared/response";
import UpdateProfileUseCase, { UpdateProfileInput } from "../../../Application/usecases/admin/update-profile-usecase";
import FindAdminByIdUseCase from "../../../Application/usecases/admin/find-admin-by-id-usecase";
import GetAllAdminsUseCase from "../../../Application/usecases/admin/get-all-admin-usecase";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { ILoginAdminUseCase } from "../../../Application/interface/admin/admin/admin-auth-usecase-interface";
import { IFindAdminByIdUseCase } from "../../../Application/interface/admin/admin/find-admin-by-id-usecase-interface";
import { IGetAllAdminsUseCase } from "../../../Application/interface/admin/admin/get-all-admin-usecase-interface";
import { IResetPasswordRequestUseCase } from "../../../Application/interface/admin/admin/reset-password-request-usecase-interface";
import { IResetPasswordUseCase } from "../../../Application/interface/admin/admin/reset-password-usecase-interface";
import { IUpdateProfileUseCase } from "../../../Application/interface/admin/admin/update-profile-usecase-interface";
dotenv.config();


declare module 'express-session' {
  interface SessionData {
    token?: string;
  }
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

@injectable()
export default class AdminController {
  constructor(
    @inject(TYPES.adminAuthUseCase) private loginAdminUseCase : ILoginAdminUseCase,
    @inject(TYPES.AdminResetPasswordRequestUseCase) private resetPasswordRequestUseCase: IResetPasswordRequestUseCase,
    @inject(TYPES.AdminResetPasswordUseCase) private resetPasswordUseCase: IResetPasswordUseCase,
    @inject(TYPES.updateProfileUseCase) private updateProfileUseCase: IUpdateProfileUseCase,
    @inject(TYPES.findAdminByIdUseCase) private findAdminByIdUseCase: IFindAdminByIdUseCase,
    @inject(TYPES.getAllAdminsUseCase) private getAllAdminsUseCase: IGetAllAdminsUseCase
  ){}

adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await this.loginAdminUseCase.execute(email, password);

    if (!result.success) {
       sendResponse(res, { ...result, statusCode: result.statusCode || StatusCode.BAD_REQUEST });
       return
    }

    req.session.token = result.data!.accessToken;

    const refreshToken = jwt.sign(
      { userId: result.data!.id, role: result.data!.role, email: result.data!.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.cookie("accessToken", result.data!.accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
         sendError(res, "Failed to save session", StatusCode.INTERNAL_SERVER_ERROR);
        return
      }
       sendResponse(res, { ...result, statusCode: result.statusCode || StatusCode.OK });
       return
    });

  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    if (!res.headersSent) {
      sendError(res, message, StatusCode.BAD_REQUEST);
    }
  }
};




 refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
       sendError(res, "Refresh token is required", StatusCode.UNAUTHORIZED);
       return
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET!, async (err: unknown, decoded: TokenPayload) => {
      if (err) {
         sendError(res, "Invalid refresh token", StatusCode.FORBIDDEN);
         return
      }
      const payload = decoded as TokenPayload;
      if (!payload.userId || !payload.role) {
        sendError(res, "Invalid token payload", StatusCode.FORBIDDEN);
        return
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: payload.userId,
        role: payload.role,
        email: payload.email
      });



      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      if (payload.role === 'admin') {
        const admin = await AdminModel.findById(payload.userId);
        if (admin) {
           sendSuccess(res, {
            accessToken: newAccessToken,
            user: {
              email: admin.email,
              _id: admin._id,
              role: 'admin',
            },
          }, 'Token refreshed successfully', StatusCode.OK);
          return
        }
      } else {
        const employee = await Employee.findById(payload.userId);
        if (employee) {
           sendSuccess(res, {
            accessToken: newAccessToken,
            user: {
              username: employee.employeeName,
              _id: employee._id,
              role: employee.position,
              profile: {
                emailId: employee.emailId,
                contactNumber: employee.contactNumber,
              },
            },
          }, 'Token refreshed successfully', StatusCode.OK);
          return
        }
      }

       sendError(res, "User Not Found", StatusCode.BAD_REQUEST);
       return
    });
  } catch (error) {
    console.log("Error in refreshToken controller:", error);
     sendError(res, "Failed to process refreshToken request. Please try again later.", StatusCode.INTERNAL_SERVER_ERROR);
    return
  }
};


  requestForgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this.resetPasswordRequestUseCase.execute(email);
      sendSuccess(res, null, "OTP sent to email.", StatusCode.OK);
    } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    sendError(res, errorMessage, StatusCode.BAD_REQUEST);
   }
  };

  resendOTP = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this.resetPasswordRequestUseCase.execute(email);
      sendSuccess(res, null, "New OTP sent to email.", StatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      sendError(res, message, StatusCode.BAD_REQUEST);
    }
  };


  verifyOTP = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const isValid = await this.resetPasswordRequestUseCase.verifyOtp(email, otp);
      if (isValid) {
        sendSuccess(res, null, "OTP verified successfully.", StatusCode.OK);
      } else {
        sendError(res, "Invalid OTP", StatusCode.BAD_REQUEST);
      }
    }catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    sendError(res, message, StatusCode.BAD_REQUEST);
   }
  }
 
  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      await this.resetPasswordUseCase.execute(email, password);
      sendSuccess(res, null, "Password reset successfully.", StatusCode.OK);
    } catch (err: unknown) {
     const message = err instanceof Error ? err.message : 'An unexpected error occurred';
     sendError(res, message, StatusCode.BAD_REQUEST);
   }
  };
   
  getAllAdmins = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(page)) throw new Error("Invalid page number");
      if (isNaN(limit)) throw new Error("Invalid limit");

      const { admins, total } = await this.getAllAdminsUseCase.execute(page, limit);

      sendSuccess(res, {
        admins,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      }, "Fetched admins successfully", StatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Server error while fetching admins";
      console.error("Error fetching admins:", message);
      sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR, undefined, null);
   }
  };

  // In your AdminController class
updatedProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
       sendError(res, "Unauthorized access", StatusCode.UNAUTHORIZED);
      return
    }

    // Validate input
    if (!firstName && !lastName && !phoneNumber) {
       sendError(res, "At least one field (firstName, lastName, or phoneNumber) is required", StatusCode.BAD_REQUEST);
      return
    }

  const updates: UpdateProfileInput = {
  adminId,
  firstName,
  lastName,
  phoneNumber
 };
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phoneNumber) updates.phoneNumber = phoneNumber;

    const updatedAdmin = await this.updateProfileUseCase.execute(adminId, updates);

     sendSuccess(res, {
      admin: {
        _id: updatedAdmin.id,
        email: updatedAdmin.email,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        phoneNumber: updatedAdmin.phoneNumber
      }
    }, "Profile updated successfully", StatusCode.OK);
    return

  } catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Server error while updating profile";
  console.error("Error updating profile:", message);
  sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR, undefined, null);
  return;
}

 };

 getProfile = async (req: Request, res: Response) => {
  try {
    const adminIdHeader = req.headers['adminid'];
    
    if (!adminIdHeader) {
       sendError(res, "Admin ID header is missing", StatusCode.UNAUTHORIZED);
      return
    }

    const adminId = Array.isArray(adminIdHeader) ? adminIdHeader[0] : adminIdHeader;
    if (!adminId || typeof adminId !== 'string' || adminId.trim().length === 0) {
       sendError(res, "Invalid admin ID format", StatusCode.BAD_REQUEST);
      return
    }


    const admin = await this.findAdminByIdUseCase.execute(adminId);
    
    if (!admin) {
       sendError(res, "Admin not found", StatusCode.NOT_FOUND);
      return
    }

     sendSuccess(res, {
      admin: {
        _id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phoneNumber: admin.phoneNumber
      }
    }, "Profile fetched successfully", StatusCode.OK);
    return

  }catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Server error while fetching profile";
  console.error("Error fetching profile:", message);
  sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR, undefined, null);
  return;
 }
};
}