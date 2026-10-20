import React from 'react';
import Layout from './components/Layout';

interface SecretariatReplyProps {
  name: string;
  message: string;
  originalMessage: string;
}

export const SecretariatReply: React.FC<SecretariatReplyProps> = ({ name, message, originalMessage }) => {
  return (
    <Layout preview="A reply from the DFC Secretariat" heading="A reply from the DFC Secretariat">
      <p>Dear {name},</p>
      {message.split(/\n{2,}/).map((para, i) => (
        <p key={i} style={{ whiteSpace: 'pre-wrap' }}>{para}</p>
      ))}
      <p>
        Kind regards,
        <br />
        DFC Secretariat
      </p>
      <div style={{ marginTop: '24px', padding: '12px', borderLeft: '3px solid #ddd', color: '#666', fontSize: '13px' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 'bold' }}>Your message</p>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{originalMessage}</p>
      </div>
    </Layout>
  );
};

export default SecretariatReply;
