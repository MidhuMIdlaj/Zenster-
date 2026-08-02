import { Request, Response } from "express";
import LoginEmployeeUseCase from "../../../Application/usecases/employee/login-employee-usecase";
import ResetPasswordRequestUseCase from "../../../Application/usecases/employee/reset-password-request-usecase";
import ResetPasswordUseCase from "../../../Application/usecases/employee/reset-password-usecase";
import { generateAccessToken, generateRefreshToken } from "../../../middleware/auth-middleware";
import { config } from '../../../config';
import { StatusCode } from "../../../shared/enums/statusCode";
import { sendError, sendSuccess } from "../../../shared/response";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import ILoginEmployeeUseCase from "../../../Application/interface/employee/login-employee-usecase-interface";
import { IResetPasswordRequestEmployeeUseCase } from "../../../Application/interface/employee/reset-password-request-usecase-inetrface";
import { IResetPasswordEmployeeUseCase } from "../../../Application/interface/employee/reset-password-usecase-interface";
  
@injectable()
export default class EmployeeAuthController {
  constructor(
    @inject(TYPES.loginEmployeeUsecases) private loginEmployeeUseCase : ILoginEmployeeUseCase,
    @inject(TYPES.employeeResetPasswordRequestUsecases) private resetPasswordRequestUseCase : IResetPasswordRequestEmployeeUseCase,
    @inject(TYPES.employeeResetPasswordUsecases) private resetPasswordUseCase : IResetPasswordEmployeeUseCase
  ){}
  
  login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const employee = await this.loginEmployeeUseCase.execute(email, password);

    // 2. Generate tokens
    const accessToken = generateAccessToken({
      userId: employee.id,
      role: employee.position,
      email: employee.employeeName,
    });

    const refreshToken = generateRefreshToken({
      userId: employee.id,
      role : employee.position,
      email : employee.employeeName,
    });

     res.cookie('accessToken', accessToken,{
      httpOnly: false,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'strict',
      domain: (() => {
        try {
          const urls = config.clientUrl.split(',').map(u => u.trim()).filter(Boolean);
          const u = new URL(urls[0]);
          const host = u.hostname.replace(/^www\./, '');
          return `.${host}`;
        } catch (e) {
          return undefined;
        }
      })(),
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });


    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'strict',
      domain: (() => {
        try {
          const urls = config.clientUrl.split(',').map(u => u.trim()).filter(Boolean);
          const u = new URL(urls[0]);
          const host = u.hostname.replace(/^www\./, '');
          return `.${host}`;
        } catch (e) {
          return undefined;
        }
      })(),
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

sendSuccess(res, {
      token: accessToken,
      position: employee.position,
      id: employee.id,
      employeeName: employee.employeeName,
      isDeleted: employee.isDeleted,
      role: employee.position
    }, 'Employee authenticated successfully', StatusCode.OK);

  } catch (err: unknown) {
    let message = 'Authentication failed';
    if (err instanceof Error) {
      message = err.message;
    }
    sendError(res, message, StatusCode.UNAUTHORIZED);
  }
};

  requestResetPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this.resetPasswordRequestUseCase.execute(email);
      sendSuccess(res, null, "OTP sent to email.", StatusCode.OK);
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        sendError(res, message, StatusCode.BAD_REQUEST);
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

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      await this.resetPasswordUseCase.execute(email, password);
      sendSuccess(res, null, "Password reset successfully.", StatusCode.OK);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      sendError(res, message, StatusCode.BAD_REQUEST);
    }
  };
}