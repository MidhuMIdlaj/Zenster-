// src/utils/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Employee from '../infrastructure/db/models/employee.model'
import { StatusCode } from "../shared/enums/statusCode";
import { RequestHandler } from 'express';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

interface TokenPayload {
  userId: string;
  id?: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "24h",
  });
};

// Generate Refresh Token
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: "7d",
  });
};

// Verify Token Middleware
export const verifyTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.token) {
    return res.status(StatusCode.UNAUTHORIZED).json({ error: "Authorization token required" });
  }

  const token = req.session.token;

  jwt.verify(
    token,
    config.jwtSecret,
    (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        console.error("JWT verification error:", err);
        req.session.token = undefined;
        return res.status(StatusCode.UNAUTHORIZED).json({
          error:
            err.name === "TokenExpiredError"
              ? "Token expired"
              : "Invalid token",
        });
      }

      if (decoded && typeof decoded === "object") {
        req.user = decoded as TokenPayload;
        return next();
      }

      req.session.token = undefined;
      return res.status(StatusCode.UNAUTHORIZED).json({ error: "Invalid token payload" });
    }
  );
};


export const verifyToken = async  (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || 
                 req.header('Authorization')?.replace('Bearer ', '') || 
                 req.session?.token;
    if (!token || typeof token !== 'string') {
      req.session.token = undefined;
      
       res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: 'Authorization token required' });
      return;
    }
    jwt.verify(token, config.jwtSecret, async (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        console.error('JWT verification error:', (err as jwt.VerifyErrors).name, (err as jwt.VerifyErrors).message);
        req.session.token = undefined;
        res.clearCookie('accessToken', {
          httpOnly: true,
          secure: config.nodeEnv === 'production',
          sameSite: 'strict',
        });
        const errorMessage = (err as jwt.VerifyErrors).name === 'TokenExpiredError' 
          ? 'Token expired. Please login again.' 
          : 'Invalid token. Please authenticate.';
         res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: errorMessage, shouldLogout: true });
         return
      }

      if (decoded && typeof decoded === 'object') {
        const payload = decoded as TokenPayload;
        const userId = payload.userId || payload.id;

        if (!userId) {
          req.session.token = undefined;
          res.clearCookie('accessToken');
          res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: 'Invalid token payload' });
          return;
        }

        if(payload.role == 'mechanic' || payload.role == 'coordinator'){
          const employee = await Employee.findById(userId);
            if (!employee || employee.isDeleted ) {
            return res.status(StatusCode.FORBIDDEN).json({
              success: false,
              error: 'Account deactivated by admin.',
              shouldLogout: true
            });
          }else if(!employee || employee.status == "inactive"){
              return res.status(StatusCode.FORBIDDEN).json({
              success: false,
              error: 'Account deactivated by admin.',
              shouldLogout: true
            });
          }
        }
        req.user = { userId, role: payload.role, email: payload.email };

        if (payload.exp && Date.now() >= payload.exp * 1000 - 300000) {
          const newToken = jwt.sign(
            { userId, role: payload.role, email: payload.email },
            config.jwtSecret,
            { expiresIn: '1h' }
          );
          res.cookie('accessToken', newToken, {
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
            maxAge: 3600000,
          });
          req.session.token = newToken;
        }

         next();
         return;
      }
      req.session.token = undefined;
      res.clearCookie('accessToken');
      res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: 'Invalid token payload' });
    });
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Internal server error during authentication' });
    return;
  }
};


export const checkRole = (roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Requires role: ${roles.join(', ')}` });
      return;
    }
    next();
  };
};


