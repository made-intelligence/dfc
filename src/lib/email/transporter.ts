import nodemailer from 'nodemailer';
import { getEmailConfig } from './config';

// Default fallback configuration
const defaultEmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use STARTTLS for port 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

interface SmtpTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

// Cache for email configuration
let cachedEmailConfig: SmtpTransportConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches email configuration from the database.
 *
 * Reads through getEmailConfig() rather than querying SystemSettings directly:
 * the admin settings screen stores smtpPassword encrypted, and this used to
 * read the raw column and hand the ciphertext to Gmail as the password. A
 * stored password is only used when it survives decryption and is non-empty,
 * so a blank or unusable entry falls back to SMTP_PASS instead of silently
 * failing every send.
 */
async function getEmailConfigFromDB() {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedEmailConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedEmailConfig;
  }

  try {
    const settings = await getEmailConfig();

    if (settings) {
      const port = settings.smtpPort || defaultEmailConfig.port;
      const pass =
        (settings.smtpPassword || '').trim() || defaultEmailConfig.auth.pass;

      cachedEmailConfig = {
        host: settings.smtpHost || defaultEmailConfig.host,
        port,
        secure: port === 465, // Use SSL only for port 465
        auth: {
          user: settings.smtpUser || defaultEmailConfig.auth.user,
          pass,
        },
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
