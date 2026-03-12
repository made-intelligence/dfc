import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
  heading?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, preview, heading }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{heading || 'DFC Medical'}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333', margin: 0, padding: 0, backgroundColor: '#f4f4f4' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px' }}>
          {preview && <div style={{ display: 'none', maxHeight: '0px', overflow: 'hidden' }}>{preview}</div>}
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h1 style={{ color: '#2563eb', margin: 0 }}>DFC Medical</h1>
          </div>

          {/* Content */}
          <div style={{ padding: '0 10px' }}>
            {heading && <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>{heading}</h2>}
            {children}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
            <p>&copy; {new Date().getFullYear()} DFC Medical Center. All rights reserved.</p>
            <p>123 Medical Drive, Health City</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default Layout;
