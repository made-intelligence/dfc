import React from 'react';
import Layout from './components/Layout';

interface PasswordResetProps {
  name: string;
  resetLink: string;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ name, resetLink }) => {
  return (
    <Layout preview="Reset your password" heading="Password Reset Request">
      <p>Hi {name},</p>
      <p>We received a request to reset your password for your DFC Medical account. If you didn't make this request, you can safely ignore this email.</p>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a href={resetLink} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
          Reset Password
        </a>
      </div>

      <p>This link will expire in 1 hour.</p>
    </Layout>
  );
};

export default PasswordReset;
