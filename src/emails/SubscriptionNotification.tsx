import React from 'react';
import Layout from './components/Layout';

interface SubscriptionNotificationProps {
  doctorName: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  endDate: string;
}

export const SubscriptionNotification: React.FC<SubscriptionNotificationProps> = ({
  doctorName,
  planName,
  status,
  endDate,
}) => {
  const isActive = status === 'ACTIVE';
  const color = isActive ? '#22c55e' : '#ef4444';

  return (
    <Layout preview={`Subscription Status: ${status}`} heading="Subscription Update">
      <p>Dear Dr. {doctorName},</p>
      
      <p>This is a notification regarding your <strong>{planName}</strong> subscription plan.</p>

      <div style={{ borderLeft: `4px solid ${color}`, padding: '15px', backgroundColor: isActive ? '#f0fdf4' : '#fef2f2', margin: '20px 0' }}>
        <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={{ color, fontWeight: 'bold' }}>{status}</span></p>
        <p style={{ margin: '5px 0' }}><strong>Valid Until:</strong> {endDate}</p>
      </div>

      {isActive ? (
        <p>Thank you for subscribing! You can now enjoy all the premium features.</p>
      ) : (
        <p>Please renew your subscription to continue using premium features.</p>
      )}

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a href="https://dfcmedical.com/doctor/settings/subscription" style={{ color: '#2563eb', textDecoration: 'underline' }}>
          Manage Subscription
        </a>
      </div>
    </Layout>
  );
};

export default SubscriptionNotification;
