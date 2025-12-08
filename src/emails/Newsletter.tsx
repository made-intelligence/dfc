import React from 'react';
import Layout from './components/Layout';

interface NewsletterProps {
  subject: string;
  content: string; // HTML content from rich text editor
}

export const Newsletter: React.FC<NewsletterProps> = ({ subject, content }) => {
  return (
    <Layout preview={subject} heading={subject}>
     <div className="newsletter-content" dangerouslySetInnerHTML={{ __html: content }} />
     
     <div style={{ marginTop: '40px', fontSize: '11px', color: '#999', textAlign: 'center' }}>
        <p>You received this email because you are subscribed to the DFC Medical newsletter.</p>
        <p><a href="#" style={{ color: '#999' }}>Unsubscribe</a></p>
     </div>
    </Layout>
  );
};

export default Newsletter;
