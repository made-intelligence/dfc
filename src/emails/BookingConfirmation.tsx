import React from 'react';
import Layout from './components/Layout';

interface BookingConfirmationProps {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  meetingLink?: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  patientName,
  doctorName,
  date,
  time,
  meetingLink,
}) => {
  return (
    <Layout preview={`Booking Confirmed with ${doctorName}`} heading="Appointment Confirmed">
      <p>Dear {patientName},</p>
      <p>Your appointment with <strong>Dr. {doctorName}</strong> has been successfully booked.</p>
      
      <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
        <p style={{ margin: '5px 0' }}><strong>Date:</strong> {date}</p>
        <p style={{ margin: '5px 0' }}><strong>Time:</strong> {time}</p>
        {meetingLink && (
          <p style={{ margin: '5px 0' }}>
            <strong>Meeting Link:</strong> <a href={meetingLink} style={{ color: '#2563eb' }}>Join Call</a>
          </p>
        )}
      </div>

      <p>Please ensure you are available 10 minutes before the scheduled time.</p>
      <p>If you need to reschedule or cancel, please visit your dashboard.</p>
    </Layout>
  );
};

export default BookingConfirmation;
