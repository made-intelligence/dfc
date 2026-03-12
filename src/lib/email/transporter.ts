import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default fallback configuration
const defaultEmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use STARTTLS for port 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Cache for email configuration
let cachedEmailConfig: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches email configuration from the database
 * Uses caching to avoid frequent database queries
 */
async function getEmailConfigFromDB() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (cachedEmailConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedEmailConfig;
  }

  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (settings && settings.email) {
      const emailSettings = settings.email as any;
      
      const port = emailSettings.smtpPort || defaultEmailConfig.port;
      cachedEmailConfig = {
        host: emailSettings.smtpHost || defaultEmailConfig.host,
        port: port,
        secure: port === 465, // Use SSL only for port 465
        auth: {
          user: emailSettings.smtpUser || defaultEmailConfig.auth.user,
          pass: emailSettings.smtpPassword || process.env.SMTP_PASSWORD || defaultEmailConfig.auth.pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      };
      
      lastFetchTime = now;
      return cachedEmailConfig;
    }
  } catch (error) {
    console.error('Failed to fetch email config from database:', error);
  }

  // Fallback to default config
  return defaultEmailConfig;
}

/**
 * Creates and returns a nodemailer transporter with database configuration
 */
export async function getTransporter() {
  const emailConfig = await getEmailConfigFromDB();
  return nodemailer.createTransport(emailConfig);
}

/**
 * Default transporter instance (uses default config)
 * For backward compatibility
 */
export const transporter = nodemailer.createTransport(defaultEmailConfig);

/**
 * Clears the email configuration cache
 * Call this after updating email settings in the admin dashboard
 */
export function clearEmailConfigCache() {
  cachedEmailConfig = null;
  lastFetchTime = 0;
}
