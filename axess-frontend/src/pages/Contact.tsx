// src/pages/Contact.tsx
// Beautiful Contact Page with EmailJS integration for real email delivery
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import {
  FiArrowLeft, FiMail, FiPhone, FiMapPin, FiClock,
  FiSend, FiUser, FiMessageSquare, FiFacebook,
  FiInstagram, FiLinkedin, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';

// ─── EmailJS Configuration ────────────────────────────────────────────────────
// Steps to set up (free at emailjs.com):
//  1. Sign up at https://www.emailjs.com
//  2. Add an Email Service (Gmail, Outlook, etc.) → copy the Service ID
//  3. Create an Email Template with variables: {{from_name}}, {{from_email}},
//     {{subject}}, {{message}}, {{to_name}} → copy the Template ID
//  4. Go to Account → API Keys → copy your Public Key
//  5. Replace the three values below with your own
const EMAILJS_SERVICE_ID  = 'service_1pkfnsz';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_5o4g2we';  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = '_Ut3NmbVV1kR7xsxm';   // e.g. 'abc123XYZpublic'
// ─────────────────────────────────────────────────────────────────────────────

// X (formerly Twitter) SVG icon component
const XIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

type Status = 'idle' | 'sending' | 'success' | 'error';

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setErrorMsg('');

    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current!,
        EMAILJS_PUBLIC_KEY,
      );
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 6000);
    } catch (err: any) {
      console.error('EmailJS error:', err);
      setErrorMsg(err?.text || 'Failed to send message. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 20px',
        color: 'white',
        position: 'relative',
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FiArrowLeft size={18} />
          Back to Home
        </button>

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 16,
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}>
            Get in Touch
          </h1>
          <p style={{
            fontSize: 18,
            opacity: 0.95,
            lineHeight: 1.6,
          }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '60px 20px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 40,
        }}>
          {/* Contact Information */}
          <div>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: 24,
            }}>
              Contact Information
            </h2>

            {/* Contact Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email */}
              <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'start',
                gap: 16,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <FiMail size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                    Email Address
                  </h3>
                  <a href="mailto:info@axess.bleca.ac.tz" style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontSize: 14,
                  }}>
                    info@axess.bleca.ac.tz
                  </a>
                  <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                    Send us your queries anytime!
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'start',
                gap: 16,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <FiPhone size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                    Phone Number
                  </h3>
                  <a href="tel:+255123456789" style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontSize: 14,
                    display: 'block',
                  }}>
                    +255 123 456 789
                  </a>
                  <a href="tel:+255987654321" style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontSize: 14,
                    display: 'block',
                  }}>
                    +255 987 654 321
                  </a>
                  <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                    Mon-Fri from 8am to 5pm
                  </p>
                </div>
              </div>

              {/* Location */}
              <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'start',
                gap: 16,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <FiMapPin size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                    Office Location
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
                    BLECA Innovation Hub<br />
                    Mwanza, Tanzania<br />
                    Main Campus, Building A
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'start',
                gap: 16,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <FiClock size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                    Working Hours
                  </h3>
                  <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Monday - Friday:</span>
                      <strong>8:00 AM - 5:00 PM</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Saturday:</span>
                      <strong>9:00 AM - 1:00 PM</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Sunday:</span>
                      <strong>Closed</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div style={{ marginTop: 30 }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: 16,
              }}>
                Follow Us
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* Facebook */}
                <a href="#" target="_blank" rel="noopener noreferrer"
                  style={{ width: 44, height: 44, borderRadius: 10, background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'transform 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <FiFacebook size={20} />
                </a>
                {/* X */}
                <a href="#" target="_blank" rel="noopener noreferrer" title="Follow us on X"
                  style={{ width: 44, height: 44, borderRadius: 10, background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'transform 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <XIcon size={18} />
                </a>
                {/* Instagram */}
                <a href="#" target="_blank" rel="noopener noreferrer"
                  style={{ width: 44, height: 44, borderRadius: 10, background: '#e4405f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'transform 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <FiInstagram size={20} />
                </a>
                {/* LinkedIn */}
                <a href="#" target="_blank" rel="noopener noreferrer"
                  style={{ width: 44, height: 44, borderRadius: 10, background: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'transform 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <FiLinkedin size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* ── Contact Form ── */}
          <div style={{
            background: 'white',
            padding: 40,
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: 24,
            }}>
              Send us a Message
            </h2>

            {/* ── SUCCESS banner ── */}
            {status === 'success' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderLeft: '4px solid #22c55e',
                borderRadius: 12, padding: '16px 18px', marginBottom: 24,
                animation: 'fadeIn .3s ease',
              }}>
                <FiCheckCircle size={22} color="#16a34a" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, color: '#15803d', fontSize: 15, margin: 0 }}>
                    Message sent successfully!
                  </p>
                  <p style={{ color: '#166534', fontSize: 13, margin: '3px 0 0' }}>
                    We've received your message and will get back to you soon.
                  </p>
                </div>
              </div>
            )}

            {/* ── ERROR banner ── */}
            {status === 'error' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: '#fff1f2', border: '1px solid #fecaca',
                borderLeft: '4px solid #ef4444',
                borderRadius: 12, padding: '16px 18px', marginBottom: 24,
              }}>
                <FiAlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 700, color: '#b91c1c', fontSize: 15, margin: 0 }}>
                    Failed to send message
                  </p>
                  <p style={{ color: '#991b1b', fontSize: 13, margin: '3px 0 0' }}>
                    {errorMsg || 'Please check your connection and try again.'}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: 12, margin: '6px 0 0' }}>
                    💡 Make sure EmailJS is configured with your Service ID, Template ID, and Public Key.
                  </p>
                </div>
              </div>
            )}

            {/* ── Form ── */}
            {/* IMPORTANT: input names must match your EmailJS template variables */}
            <form ref={formRef} onSubmit={handleSubmit}>

              {/* Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <FiUser size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Your Name *
                </label>
                <input
                  type="text"
                  name="from_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '2px solid #e5e7eb', borderRadius: 10,
                    fontSize: 15, boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <FiMail size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="from_email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="john@example.com"
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '2px solid #e5e7eb', borderRadius: 10,
                    fontSize: 15, boxSizing: 'border-box', outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="How can we help you?"
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '2px solid #e5e7eb', borderRadius: 10,
                    fontSize: 15, boxSizing: 'border-box', outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <FiMessageSquare size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '2px solid #e5e7eb', borderRadius: 10,
                    fontSize: 15, boxSizing: 'border-box', resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: status === 'sending'
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'transform 0.2s, background 0.2s',
                  opacity: status === 'sending' ? 0.85 : 1,
                }}
                onMouseOver={(e) => { if (status !== 'sending') e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {status === 'sending' ? (
                  <>
                    {/* Spinning loader */}
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: 'spin .8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Sending...
                  </>
                ) : status === 'success' ? (
                  <>
                    <FiCheckCircle size={18} />
                    Sent Successfully!
                  </>
                ) : (
                  <>
                    <FiSend size={18} />
                    Send Message
                  </>
                )}
              </button>

              {/* Setup hint — shown only before first successful send */}
              {status !== 'success' && (
                <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  📧 Powered by <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>EmailJS</a> · Messages are delivered directly to our inbox
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Contact;