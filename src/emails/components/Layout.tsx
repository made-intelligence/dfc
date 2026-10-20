import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
  heading?: string;
}

export const BRAND_NAVY = '#0D1F3C';
export const BRAND_TEAL = '#0A6E75';

/** Inline style for a primary call-to-action link in any email template. */
export const buttonStyle: React.CSSProperties = {
  backgroundColor: BRAND_NAVY,
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  display: 'inline-block',
};

// Email clients need a full HTML document; this is rendered to static markup,
// never by Next.js, so next/head does not apply.
/* eslint-disable @next/next/no-head-element */
export const Layout: React.FC<LayoutProps> = ({ children, preview, heading }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{heading || 'Doctors Foundation for Care'}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333', margin: 0, padding: 0, backgroundColor: '#f4f4f4' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px' }}>
          {preview && <div style={{ display: 'none', maxHeight: '0px', overflow: 'hidden' }}>{preview}</div>}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: `3px solid ${BRAND_NAVY}`, paddingBottom: '10px' }}>
            <h1 style={{ color: BRAND_NAVY, margin: 0, fontSize: '22px' }}>Doctors Foundation for Care</h1>
          </div>

          {/* Content */}
          <div style={{ padding: '0 10px' }}>
            {heading && <h2 style={{ fontSize: '20px', marginBottom: '15px', color: BRAND_NAVY }}>{heading}</h2>}
            {children}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
            <p>&copy; {new Date().getFullYear()} Doctors Foundation for Care. Lagos, Nigeria.</p>
            <p>
              <a href="https://www.dfcare.org" style={{ color: BRAND_TEAL }}>www.dfcare.org</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
/* eslint-enable @next/next/no-head-element */

export default Layout;
