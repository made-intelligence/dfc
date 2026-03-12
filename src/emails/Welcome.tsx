import React from 'react';
import Layout from './components/Layout';

interface WelcomeProps {
  name: string;
  actionUrl: string;
}

export const Welcome: React.FC<WelcomeProps> = ({ name, actionUrl }) => {
  return (
    <Layout preview="Welcome to DFC Medical" heading="Welcome to DFC Medical!">
      <p>Hi {name},</p>
      <p>We are thrilled to have you on board. DFC Medical is committed to providing you with the best healthcare experience.</p>
      
      <p>You can now:</p>
      <ul>
        <li>Book appointments with top specialists</li>
        <li>Manage your medical records</li>
        <li>Consult with doctors online</li>
      </ul>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a href={actionUrl} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
          Go to Dashboard
        </a>
      </div>

      <p>If you have any questions, feel free to reply to this email.</p>
    </Layout>
  );
};

export default Welcome;
