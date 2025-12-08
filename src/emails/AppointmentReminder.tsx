import React from 'react';
import Layout from './components/Layout';

interface AppointmentReminderProps {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  meetingLink?: string;
}

export const AppointmentReminder: React.FC<AppointmentReminderProps> = ({
  patientName,
  doctorName,
  date,
  time,
  meetingLink,
}) => {
  return (
    <Layout preview={`Reminder: Appointment with ${doctorName}`} heading="Appointment Reminder">
      <p>Hello {patientName},</p>
      <p>This is a reminder for your upcoming appointment with <strong>Dr. {doctorName}</strong>.</p>
      
      <div style={{ backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316', padding: '15px', margin: '20px 0' }}>
        <p style={{ margin: '5px 0' }}><strong>Date:</strong> {date}</p>
        <p style={{ margin: '5px 0' }}><strong>Time:</strong> {time}</p>
      </div>

      {meetingLink && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href={meetingLink} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
            Join Consultation
          </a>
        </div>
      )}

      <p>We look forward to seeing you!</p>
    </Layout>
  );
};

export default AppointmentReminder;
