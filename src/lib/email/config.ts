import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt, isEncrypted } from '../encryption';

const prisma = new PrismaClient();

/**
 * Email configuration interface matching the database structure
 */
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string; // Optional, can be stored in env for security
  fromEmail: string;
  replyEmail: string;
  enableSSL: boolean;
}

/**
 * Type guard to validate if a value is a valid EmailConfig
 */
function isEmailConfig(value: unknown): value is EmailConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const config = value as Record<string, unknown>;
  
  return (
    typeof config.smtpHost === 'string' &&
    typeof config.smtpPort === 'number' &&
    typeof config.smtpUser === 'string' &&
    (config.smtpPassword === undefined || typeof config.smtpPassword === 'string') &&
    typeof config.fromEmail === 'string' &&
    typeof config.replyEmail === 'string' &&
    typeof config.enableSSL === 'boolean'
  );
}

/**
 * Fetches the email configuration from the database
 * Returns null if no configuration is found
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (settings && settings.email) {
      // Validate the JSON data before returning
      if (isEmailConfig(settings.email)) {
        // Type assertion is safe here because isEmailConfig validates the structure
        const config = settings.email as EmailConfig;
        
        // Decrypt password if it exists and is encrypted
        if (config.smtpPassword && isEncrypted(config.smtpPassword)) {
          return {
            ...config,
            smtpPassword: decrypt(config.smtpPassword),
          };
        }
        
        return config;
      }
      console.warn('Email configuration in database has invalid structure');
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch email configuration:', error);
    return null;
  }
}

/**
 * Updates the email configuration in the database
 */
export async function updateEmailConfig(emailConfig: Partial<EmailConfig>): Promise<boolean> {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      // Safely get current email config
      let currentEmail: Partial<EmailConfig> = {};
      if (settings.email && isEmailConfig(settings.email)) {
        currentEmail = settings.email;
      }
      
      // Encrypt password if provided
      const configToSave = { ...emailConfig };
      if (configToSave.smtpPassword) {
        configToSave.smtpPassword = encrypt(configToSave.smtpPassword);
      }
      
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          email: {
            ...currentEmail,
            ...configToSave,
          },
        },
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to update email configuration:', error);
    return false;
  }
}
