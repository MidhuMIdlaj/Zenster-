// services/smsService.ts
import axios from 'axios';
import { config } from '../../config';

const SMS_CONFIG = {
  // For Twilio
  TWILIO_ACCOUNT_SID: config.twilioAccountSid,
  TWILIO_AUTH_TOKEN: config.twilioAuthToken,
  TWILIO_PHONE_NUMBER: config.twilioPhoneNumber,
  
  // For AWS SNS
  AWS_ACCESS_KEY_ID: config.awsAccessKeyId,
  AWS_SECRET_ACCESS_KEY: config.awsSecretAccessKey,
  AWS_REGION: config.awsRegion,
  
  // For MSG91 (Indian SMS service)
  MSG91_AUTH_KEY: config.msg91AuthKey,
  MSG91_SENDER_ID: config.msg91SenderId,
  MSG91_ROUTE: config.msg91Route,
  
  // For TextLocal (UK/India)
  TEXTLOCAL_API_KEY: config.textlocalApiKey,
  TEXTLOCAL_SENDER: config.textlocalSender
};

// SMS Provider Interface
interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<boolean>;
}

// Twilio SMS Provider
class TwilioSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const accountSid = SMS_CONFIG.TWILIO_ACCOUNT_SID;
      const authToken = SMS_CONFIG.TWILIO_AUTH_TOKEN;
      const fromNumber = SMS_CONFIG.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio configuration missing');
      }

      const client = require('twilio')(accountSid, authToken);
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: phone
      });

      return true;
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      return false;
    }
  }
}

// MSG91 SMS Provider (Popular in India)
class MSG91SMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const authKey = SMS_CONFIG.MSG91_AUTH_KEY;
      const senderId = SMS_CONFIG.MSG91_SENDER_ID;
      const route = SMS_CONFIG.MSG91_ROUTE;

      if (!authKey || !senderId) {
        throw new Error('MSG91 configuration missing');
      }

      const url = 'https://api.msg91.com/api/sendhttp.php';
      const params = new URLSearchParams({
        authkey: authKey,
        mobiles: phone.replace('+', ''),
        message: message,
        sender: senderId,
        route: route,
        country: '91' // India country code
      });

      const response = await axios.post(url, params);
      
      if (response.data.type === 'success') {
        return true;
      } else {
        throw new Error(`MSG91 Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('MSG91 SMS Error:', error);
      return false;
    }
  }
}

// TextLocal SMS Provider
class TextLocalSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const apiKey = SMS_CONFIG.TEXTLOCAL_API_KEY;
      const sender = SMS_CONFIG.TEXTLOCAL_SENDER;

      if (!apiKey || !sender) {
        throw new Error('TextLocal configuration missing');
      }

      const url = 'https://api.textlocal.in/send/';
      const params = new URLSearchParams({
        apikey: apiKey,
        numbers: phone.replace('+', ''),
        message: message,
        sender: sender
      });

      const response = await axios.post(url, params);
      
      if (response.data.status === 'success') {
        return true;
      } else {
        throw new Error(`TextLocal Error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      console.error('TextLocal SMS Error:', error);
      return false;
    }
  }
}

// Factory function to get SMS provider based on configuration
function getSMSProvider(): SMSProvider {
  if (SMS_CONFIG.TWILIO_ACCOUNT_SID && SMS_CONFIG.TWILIO_AUTH_TOKEN) {
    return new TwilioSMSProvider();
  } else if (SMS_CONFIG.MSG91_AUTH_KEY) {
    return new MSG91SMSProvider();
  } else if (SMS_CONFIG.TEXTLOCAL_API_KEY) {
    return new TextLocalSMSProvider();
  } else {
    throw new Error('No SMS provider configured. Please set up Twilio, MSG91, or TextLocal credentials.');
  }
}

// Main SMS function
export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    if (!phone || phone.length < 10) {
      throw new Error('Invalid phone number');
    }

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
        formattedPhone = '+91' + formattedPhone.substring(1);
      } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
        formattedPhone = '+' + formattedPhone;
      }
    }

    const provider = getSMSProvider();
    const result = await provider.sendSMS(formattedPhone, message);
    
    if (result) {
      return true;
    } else {
      throw new Error('SMS sending failed');
    }
  } catch (error: any) {
    console.error('SMS Service Error:', error.message);
    throw error;
  }
};

// Utility function for complaint-specific messages
export const sendComplaintAcceptedSMS = async (phone: string, complaintId: string, mechanicName?: string): Promise<boolean> => {
  const message = mechanicName 
    ? `Hello! Your complaint #${complaintId} has been accepted by ${mechanicName}. Work will begin shortly. We'll keep you updated. Thank you!`
    : `Hello! Your complaint #${complaintId} has been accepted by our mechanic. Work will begin shortly. We'll keep you updated. Thank you!`;
    
  return await sendSMS(phone, message);
};