import dotenv from 'dotenv';

dotenv.config();

interface Config {
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Database
  mongoUri: string;
  
  // Authentication
  jwtSecret: string;
  refreshTokenSecret: string;
  sessionSecret: string;
  
  // Client
  clientUrl: string;
  publicApiUrl: string;
  
  // Email Configuration
  emailService: 'gmail' | 'resend' | 'mailtrap' | 'ethereal';
  emailEnabled: boolean;
  emailUser: string;
  emailPass: string;
  resendApiKey: string;
  resendFrom: string;
  
  // SMS Configuration
  smsEnabled: boolean;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  msg91AuthKey: string;
  msg91SenderId: string;
  msg91Route: string;
  textlocalApiKey: string;
  textlocalSender: string;
  
  // Video Call (Zego)
  zegoAppId: number;
  zegoServerSecret: string;
  
  // AWS Configuration
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsBucketName: string;

  // Google Maps Configuration
  googleMapsApiKey: string;
}

class Environment {
  private config: Config;

  constructor() {
    this.config = this.validateAndLoad();
  }

  private validateAndLoad(): Config {
    const requiredVariables = [
      'MONGO_URI',
      'JWT_SECRET',
      'PORT',
      'CLIENT_URL'
    ];

    const missing = requiredVariables.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please check your .env file in the Backend directory.`
      );
    }

    return {
      // Server
      port: parseInt(process.env.PORT || '5000', 10),
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      
      // Database
      mongoUri: process.env.MONGO_URI!,
      
      // Authentication
      jwtSecret: process.env.JWT_SECRET!,
      refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET!,
      sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
      
      // Client
      clientUrl: process.env.CLIENT_URL!,
      publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`,
      
      // Email Configuration
      emailService: (process.env.EMAIL_SERVICE || 'gmail').toLowerCase() as 'gmail' | 'resend' | 'mailtrap' | 'ethereal',
      emailEnabled: process.env.ENABLE_EMAIL === 'true',
      emailUser: process.env.EMAIL_USER || '',
      emailPass: process.env.EMAIL_PASS || '',
      resendApiKey: process.env.RESEND_API_KEY || '',
      resendFrom: process.env.RESEND_FROM || 'onboarding@resend.dev',
      
      // SMS Configuration
      smsEnabled: !!(process.env.TWILIO_ACCOUNT_SID || process.env.MSG91_AUTH_KEY || process.env.TEXTLOCAL_API_KEY),
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
      msg91SenderId: process.env.MSG91_SENDER_ID || '',
      msg91Route: process.env.MSG91_ROUTE || '4',
      textlocalApiKey: process.env.TEXTLOCAL_API_KEY || '',
      textlocalSender: process.env.TEXTLOCAL_SENDER || '',
      
      // Video Call (Zego)
      zegoAppId: parseInt(process.env.ZEGO_APP_ID || '0', 10),
      zegoServerSecret: process.env.ZEGO_SERVER_SECRET || '',
      
      // AWS Configuration
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      awsRegion: process.env.AWS_REGION || '',
      awsBucketName: process.env.AWS_BUCKET_NAME || '',

      // Google Maps Configuration
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    };
  }

  getConfig(): Readonly<Config> {
    return Object.freeze({ ...this.config });
  }

  // Convenience methods for common values
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  hasAwsS3Config(): boolean {
    return !!(
      this.config.awsAccessKeyId &&
      this.config.awsSecretAccessKey &&
      this.config.awsRegion &&
      this.config.awsBucketName
    );
  }

  hasSmsConfig(): boolean {
    return !!(
      this.config.twilioAccountSid ||
      this.config.msg91AuthKey ||
      this.config.textlocalApiKey
    );
  }

  hasEmailConfig(): boolean {
    return !!(this.config.emailUser && this.config.emailPass) || 
           (this.config.emailService === 'resend' && !!this.config.resendApiKey);
  }

  hasGoogleMapsConfig(): boolean {
    return !!this.config.googleMapsApiKey;
  }
}

export const environment = new Environment();

// Export config as singleton
export const config = environment.getConfig();
export type { Config };
