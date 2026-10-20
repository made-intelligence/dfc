import React from 'react';
import Layout, { buttonStyle } from './components/Layout';

export type SecondOpinionEvent = 'PAID' | 'ASSIGNED' | 'VIDEO_CALL' | 'REPORT_READY';

interface SecondOpinionUpdateProps {
  event: SecondOpinionEvent;
  patientName: string;
  reference: string;
  specialty: string;
  /** Secure report link; REPORT_READY only. */
  reportUrl?: string;
  /** Formatted call time and joining link; VIDEO_CALL only. */
  callTime?: string;
  callLink?: string;
}

const HEADINGS: Record<SecondOpinionEvent, string> = {
  PAID: 'We have received your second opinion request',
  ASSIGNED: 'A specialist is reviewing your case',
  VIDEO_CALL: 'Your video consultation is scheduled',
  REPORT_READY: 'Your second opinion report is ready',
};

export const SecondOpinionUpdate: React.FC<SecondOpinionUpdateProps> = ({
  event,
  patientName,
  reference,
  specialty,
  reportUrl,
  callTime,
  callLink,
}) => {
  const heading = HEADINGS[event];
  return (
    <Layout preview={`${heading} (${reference})`} heading={heading}>
      <p>Dear {patientName},</p>

      {event === 'PAID' && (
        <p>
          Thank you. Your payment is confirmed and your {specialty} second opinion request is now in
          our queue. Our secretariat will assign a reviewing specialist shortly, and we will email
          you again when they do.
        </p>
      )}

      {event === 'ASSIGNED' && (
        <p>
          A DFC {specialty} specialist has been assigned to your case and will review your records.
          We will email you as soon as the written report is ready.
        </p>
      )}

      {event === 'VIDEO_CALL' && (
        <>
          <p>Your video consultation with the reviewing specialist has been scheduled for:</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{callTime}</p>
          {callLink && (
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <a href={callLink} style={buttonStyle}>Join the call</a>
            </div>
          )}
        </>
      )}

      {event === 'REPORT_READY' && (
        <>
          <p>
            The specialist has completed their review. You can read, print or save your report
            using the secure link below.
          </p>
          {reportUrl && (
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <a href={reportUrl} style={buttonStyle}>View your report</a>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#666' }}>
            This link is personal to you. Please do not forward it. The report is an independent
            opinion and does not replace advice from your treating physician.
          </p>
        </>
      )}

      <p>
        Case reference: <strong>{reference}</strong>
      </p>
      <p>If you have any questions, reply to this email and quote your case reference.</p>
    </Layout>
  );
};

export default SecondOpinionUpdate;
