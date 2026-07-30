/**
 * JWT Token Utility Functions
 * Handles token generation, validation, and refresh
 */

import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'employee' | 'coordinator' | 'admin';
  permissions: string[];
  iat?: number;
  exp?: number;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private static readonly ACCESS_TOKEN_EXPIRY: string | number = process.env.JWT_EXPIRY || '15m';
  private static readonly REFRESH_TOKEN_EXPIRY: string | number = process.env.JWT_REFRESH_EXPIRY || '7d';

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    const signOptions: SignOptions = {
      expiresIn: '15m' as const,
      algorithm: 'HS256',
      issuer: 'location-tracking-system',
      audience: 'location-api',
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, signOptions);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    const signOptions: SignOptions = {
      expiresIn: '7d' as const,
      algorithm: 'HS256',
      issuer: 'location-tracking-system',
    };

    const refreshPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    return jwt.sign(refreshPayload, this.REFRESH_TOKEN_SECRET, signOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(payload: JWTPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const verifyOptions: VerifyOptions = {
        algorithms: ['HS256'],
        issuer: 'location-tracking-system',
        audience: 'location-api',
      };

      return jwt.verify(token, this.ACCESS_TOKEN_SECRET, verifyOptions) as JWTPayload;
    } catch (error) {
      console.error('Token verification failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const verifyOptions: VerifyOptions = {
        algorithms: ['HS256'],
        issuer: 'location-tracking-system',
      };

      return jwt.verify(token, this.REFRESH_TOKEN_SECRET, verifyOptions) as JWTPayload;
    } catch (error) {
      console.error('Refresh token verification failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as unknown;
      if (!decoded || typeof decoded !== 'object' || decoded === null) {
        return true;
      }

      const exp = (decoded as { exp?: number }).exp;
      if (!exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Decode token without verification
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as unknown;
      if (!decoded || typeof decoded !== 'object' || decoded === null) return null;
      return decoded as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpirationTime(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as unknown;
      if (!decoded || typeof decoded !== 'object' || decoded === null) return null;

      const exp = (decoded as { exp?: number }).exp;
      if (!exp) return null;

      return new Date(exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get remaining time until expiration (in milliseconds)
   */
  static getTimeUntilExpiration(token: string): number | null {
    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) {
      return null;
    }

    return expirationTime.getTime() - Date.now();
  }

  /**
   * Check if token should be refreshed (if expiring in next 5 minutes)
   */
  static shouldRefreshToken(token: string): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    if (timeUntilExpiration === null) {
      return true;
    }

    const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    return timeUntilExpiration < REFRESH_THRESHOLD;
  }
}

/**
 * Token Blacklist for logout functionality
 */
export class TokenBlacklist {
  private static blacklistedTokens: Set<string> = new Set();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize cleanup interval
   */
  static initialize(): void {
    if (!this.cleanupInterval) {
      // Clean up expired tokens every hour
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60 * 60 * 1000);
    }
  }

  /**
   * Add token to blacklist
   */
  static add(token: string): void {
    this.blacklistedTokens.add(token);
  }

  /**
   * Check if token is blacklisted
   */
  static isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Remove expired tokens from blacklist
   */
  private static cleanup(): void {
    const tokensToRemove: string[] = [];

    this.blacklistedTokens.forEach((token) => {
      if (JWTService.isTokenExpired(token)) {
        tokensToRemove.push(token);
      }
    });

    tokensToRemove.forEach((token) => {
      this.blacklistedTokens.delete(token);
    });

    console.log(`Cleaned up ${tokensToRemove.length} expired tokens from blacklist`);
  }

  /**
   * Clear all tokens (use with caution)
   */
  static clear(): void {
    this.blacklistedTokens.clear();
  }

  /**
   * Get blacklist size
   */
  static size(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * Stop cleanup interval
   */
  static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
