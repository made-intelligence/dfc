import React from 'react';
import Layout from './components/Layout';

interface ClaimInviteProps {
  name: string;
  claimLink: string;
  expiryDays?: number;
}

export const ClaimInvite: React.FC<ClaimInviteProps> = ({ name, claimLink, expiryDays = 30 }) => {
  return (
    <Layout preview="Activate your Doctors Foundation for Care account" heading="Activate your DFC account">
      <p>Dear {name},</p>
      <p>
        An account has been created for you on the Doctors Foundation for Care (DFC) platform at
        dfcare.org. To activate it, please set your password using the secure link below.
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={claimLink}
          style={{
            backgroundColor: '#0A6E75',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          Claim your account
        </a>
      </div>

      <p style={{ fontSize: '14px', color: '#555' }}>
        If the button does not work, copy and paste this link into your browser:
        <br />
        <a href={claimLink} style={{ color: '#0A6E75', wordBreak: 'break-all' }}>
          {claimLink}
        </a>
      </p>

      <p style={{ fontSize: '14px', color: '#555' }}>
        This link is unique to you and will expire in {expiryDays} days. If it expires, contact the
        DFC secretariat and we will send you a new one.
      </p>

      <p style={{ marginTop: '24px' }}>
        Warm regards,
        <br />
        The Doctors Foundation for Care Secretariat
      </p>
    </Layout>
  );
};

export default ClaimInvite;
