// src/pages/HelpSupport.tsx
import React from 'react';
import { Icons } from '../components/icons';

const HelpSupport: React.FC = () => {
  return (
    <>
      <h1 className="section-title">Help & Support</h1>

      <div className="help-grid">
        {/* FAQ Section */}
        <div className="help-card faq-card">
          <div className="card-header">
            <Icons.HelpCircle size={22} />
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            <div className="faq-item">
              <h3>How do I request a room key?</h3>
              <p>
                Go to the Rooms page, click on any room card, then select "Request Key". Fill in the purpose, devices/items you're bringing, and desired time slot. Submit — your request will be reviewed quickly.
              </p>
            </div>

            <div className="faq-item">
              <h3>What should I do if I lose or damage a key?</h3>
              <p>
                Report it immediately using the "Report Issue" button on the Rooms page or speak to the Guard at the desk. Replacement fees may apply depending on the situation.
              </p>
            </div>

            <div className="faq-item">
              <h3>How long can I book a room for?</h3>
              <p>
                Standard sessions are up to 4 hours. For longer bookings, include justification in the purpose field — coordinator approval is required.
              </p>
            </div>

            <div className="faq-item">
              <h3>Who is allowed to use the innovation center?</h3>
              <p>
                Registered MUST students, staff, approved innovators, and verified external collaborators with valid aXess accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="help-card contact-card">
          <div className="card-header">
            <Icons.Bell size={22} />
            <h2>Contact Support</h2>
          </div>

          <div className="support-intro">
            <p>
              The fastest way to get help is to first check the FAQ on the left. 
              If your question isn't answered, use one of the contact methods below.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="contact-methods">
            <div className="contact-method">
              <Icons.Mail size={24} />
              <div className="contact-details">
                <strong>Email</strong>
                <p>support@axess.must.ac.tz</p>
                <small>Best for detailed questions & screenshots</small>
              </div>
            </div>

            <div className="contact-method">
              <Icons.Phone size={24} />
              <div className="contact-details">
                <strong>Phone (Reception Desk)</strong>
                <p>+255 700 123 456</p>
                <small>Fastest for urgent key issues (office hours)</small>
              </div>
            </div>

            <div className="contact-method">
              <Icons.MapPin size={24} />
              <div className="contact-details">
                <strong>Visit Us</strong>
                <p>CITT Building, Ground Floor</p>
                <small>Come to the help desk during working hours</small>
              </div>
            </div>
          </div>

          {/* Best Ways to Get Help */}
          <div className="quick-tips">
            <h3>Best Way to Get Fast Help</h3>
            <ul>
              <li>Include your <strong>Student/Staff ID</strong> and <strong>room number</strong></li>
              <li>Describe the problem clearly (with screenshots if possible)</li>
              <li>For urgent key problems → call the Reception Desk first</li>
              <li>Expect a reply within a few hours during working days</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpSupport;