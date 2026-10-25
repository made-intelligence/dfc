import React from 'react';
import Layout, { buttonStyle } from './components/Layout';

export type AppointmentEmailKind = 'CONFIRMED' | 'REMINDER_DAY' | 'REMINDER_HOUR';

interface AppointmentEmailProps {
  kind: AppointmentEmailKind;
  recipientName: string;
  /** "doctor" when the recipient is the doctor, "patient" otherwise. */
  recipientRole: 'doctor' | 'patient';
  otherPartyName: string;
  dateLabel: string;
  timeLabel: string;
  reason?: string | null;
  /** Absolute URL of the video room; omitted for in-person appointments. */
  joinUrl?: string;
  clinicLocation?: string | null;
  manageUrl: string;
}

const HEADINGS: Record<AppointmentEmailKind, string> = {
  CONFIRMED: 'Appointment confirmed',
  REMINDER_DAY: 'Your upcoming consultation',
  REMINDER_HOUR: 'Your consultation starts soon',
};

export const AppointmentEmail: React.FC<AppointmentEmailProps> = ({
  kind,
  recipientName,
  recipientRole,
  otherPartyName,
  dateLabel,
  timeLabel,
  reason,
  joinUrl,
  clinicLocation,
  manageUrl,
}) => {
  const heading = HEADINGS[kind];
  const withWhom = recipientRole === 'doctor' ? otherPartyName : `Dr. ${otherPartyName}`;
  const isVideo = !!joinUrl;

  return (
    <Layout preview={`${heading}: ${withWhom}, ${dateLabel} ${timeLabel}`} heading={heading}>
      <p>Dear {recipientName},</p>

      {kind === 'CONFIRMED' && (
        <p>
          {recipientRole === 'doctor'
            ? <>A patient, <strong>{otherPartyName}</strong>, has booked and paid for a consultation with you.</>
            : <>Your consultation with <strong>{withWhom}</strong> is booked and paid for.</>}
        </p>
      )}
      {kind === 'REMINDER_DAY' && (
        <p>This is a reminder of your consultation with <strong>{withWhom}</strong> on {dateLabel} at {timeLabel}.</p>
      )}
      {kind === 'REMINDER_HOUR' && (
        <p>Your consultation with <strong>{withWhom}</strong> starts within the hour.</p>
      )}

      <div style={{ backgroundColor: '#f8f9fb', borderLeft: '4px solid #0A6E75', padding: '15px', margin: '20px 0' }}>
        <p style={{ margin: '5px 0' }}><strong>Date:</strong> {dateLabel}</p>
        <p style={{ margin: '5px 0' }}><strong>Time:</strong> {timeLabel}</p>
        <p style={{ margin: '5px 0' }}>
          <strong>Type:</strong> {isVideo ? 'Video consultation' : 'In person'}
        </p>
        {!isVideo && clinicLocation && (
          <p style={{ margin: '5px 0' }}><strong>Location:</strong> {clinicLocation}</p>
        )}
        {reason && <p style={{ margin: '5px 0' }}><strong>Reason:</strong> {reason}</p>}
      </div>

      {isVideo && (
        <>
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href={joinUrl} style={buttonStyle}>Join the video consultation</a>
          </div>
          <p style={{ fontSize: '13px', color: '#666' }}>
            The room opens 10 minutes before the start time. Use a phone or computer with a camera
            and microphone, in a quiet place with a reliable internet connection, and allow camera
            and microphone access when your browser asks.
          </p>
        </>
      )}

      <p>
        To see or manage your appointments, visit <a href={manageUrl} style={{ color: '#0A6E75' }}>your portal</a>.
      </p>
    </Layout>
  );
};

export default AppointmentEmail;
