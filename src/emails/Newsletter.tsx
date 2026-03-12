import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import Layout from './components/Layout';

interface NewsletterProps {
  subject: string;
  content: string; // HTML content from rich text editor
}

export const Newsletter: React.FC<NewsletterProps> = ({ subject, content }) => {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target', 'rel', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <Layout preview={subject} heading={subject}>
     <div className="newsletter-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
     
     <div style={{ marginTop: '40px', fontSize: '11px', color: '#999', textAlign: 'center' }}>
        <p>You received this email because you are subscribed to the DFC Medical newsletter.</p>
        <p><a href="#" style={{ color: '#999' }}>Unsubscribe</a></p>
     </div>
    </Layout>
  );
};

export default Newsletter;
