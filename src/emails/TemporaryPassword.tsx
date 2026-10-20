import React from 'react';
import Layout from './components/Layout';

interface TemporaryPasswordProps {
  name: string;
  password: string;
  kind: 'welcome' | 'reset';
  expiryHours: number;
}

export const TemporaryPasswordEmail: React.FC<TemporaryPasswordProps> = ({ name, password, kind, expiryHours }) => {
  const welcome = kind === 'welcome';
  return (
    <Layout
      preview={welcome ? 'Your DFC account password' : 'Your new DFC password'}
      heading={welcome ? 'Your account is ready' : 'Your new password'}
    >
      <p>Hi {name},</p>
      <p>
        {welcome
          ? 'We created your Doctors Foundation for Care account so you can book your consultation. Enter this password on the booking page to continue:'
          : 'Here is a new password for your Doctors Foundation for Care account. Enter it to sign in:'}
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: 'monospace',
            fontSize: '28px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            color: '#0D1F3C',
            backgroundColor: '#F1F5F9',
            padding: '14px 24px',
            borderRadius: '8px',
          }}
        >
          {password}
        </span>
      </div>

      <p>
        It works for {expiryHours} hours, and once you sign in with it, it becomes your password.
        {welcome ? '' : ' Your old password keeps working until then.'}
      </p>
      <p>If you did not request this, you can ignore this email.</p>
    </Layout>
  );
};

export default TemporaryPasswordEmail;
