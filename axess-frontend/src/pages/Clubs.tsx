// src/pages/Clubs.tsx
// Clubs & Startups Page - Showcase all student organizations
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCode, FiTrendingUp, FiGlobe, FiMic, FiCamera,
  FiMusic, FiMonitor, FiBookOpen, FiActivity, FiHeart,
  FiArrowLeft, FiUsers, FiCalendar, FiMapPin, FiMail,
  FiX, FiArrowRight, FiImage, FiInfo,
} from 'react-icons/fi';

interface Club {
  id: number;
  name: string;
  icon: React.ReactNode;
  description: string;
  fullDescription: string;
  color: string;
  gradient: string;
  meetingDay?: string;
  meetingLocation?: string;
  memberCount?: string;
  imageUploaded?: boolean; // in a real app this would be a URL
}

const clubs: Club[] = [
  {
    id: 1,
    name: 'Innovation & Tech Club',
    icon: <FiCode size={32} />,
    description: 'Organizes coding workshops, hackathons, AI/robotics projects, tech talks and app development sessions for students interested in technology and programming.',
    fullDescription: `The Innovation & Tech Club is the heartbeat of technology on campus. We organize weekly coding workshops covering everything from web development (React, Node.js) to mobile apps and AI/ML projects. 

Our signature events include a semester-long hackathon where teams compete to solve real campus and community problems, monthly tech talks by industry professionals, and robotics build sessions where members construct and program autonomous robots.

Members also collaborate on live app projects that get deployed and used by students. Whether you're a complete beginner or an advanced developer, there's a place for you here. We believe in learning by building — come join us and ship something real.`,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    meetingDay: 'Every Tuesday, 4:00 PM',
    meetingLocation: 'Computer Lab B, Ground Floor',
    memberCount: '120+ members',
  },
  {
    id: 2,
    name: 'Entrepreneurship & Startup Club',
    icon: <FiTrendingUp size={32} />,
    description: 'Helps students develop business ideas, learn pitching skills, organize startup weekends, connect with mentors and explore entrepreneurship through real-world projects.',
    fullDescription: `The Entrepreneurship & Startup Club transforms ideas into real ventures. We run structured programs throughout the year including Startup Weekend (a 54-hour event where teams go from idea to prototype), monthly pitch nights where members present their business concepts to a panel of mentors and investors, and business model canvas workshops.

We maintain an active mentor network of successful alumni entrepreneurs and local business leaders who provide 1-on-1 mentorship. Members get access to our startup resource library, legal and financial templates, and introductions to seed funding opportunities.

Whether you have a fully formed idea or just a spark of curiosity, our community will help you test, validate, and launch. Several alumni have gone on to run funded startups after starting right here in our club.`,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    meetingDay: 'Every Wednesday, 5:00 PM',
    meetingLocation: 'Innovation Hub, First Floor',
    memberCount: '85+ members',
  },
  {
    id: 3,
    name: 'Environmental & Sustainability Club',
    icon: <FiGlobe size={32} />,
    description: 'Runs campus clean-ups, tree-planting campaigns, recycling drives, climate awareness events and sustainability workshops to promote eco-friendly behavior.',
    fullDescription: `The Environmental & Sustainability Club is committed to making our campus and community greener, one initiative at a time. We coordinate monthly campus clean-ups, quarterly tree-planting campaigns in partnership with local authorities, and manage the campus recycling program.

Our education arm runs climate awareness workshops, documentary screenings, and a popular "Sustainability Challenge" where students track and reduce their carbon footprint over a month. We also partner with local NGOs on water conservation projects.

We believe real change starts locally. Our members have successfully lobbied for solar panels on two campus buildings and introduced biodegradable packaging in the campus cafeteria. Join us to be part of tangible, measurable environmental impact.`,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    meetingDay: 'Every Thursday, 3:30 PM',
    meetingLocation: 'Outdoor Amphitheater / Room 105',
    memberCount: '70+ members',
  },
  {
    id: 4,
    name: 'Debate & Public Speaking Club',
    icon: <FiMic size={32} />,
    description: 'Trains members in debating, public speaking, moot courts and speech competitions to build confidence, critical thinking and communication skills.',
    fullDescription: `The Debate & Public Speaking Club is where future leaders find their voice. We run weekly training sessions covering argumentation techniques, logical fallacy identification, impromptu speaking, and structured debating formats (British Parliamentary, Oxford-style).

Members participate in inter-university debate tournaments, Toastmasters-style speech competitions, and our flagship annual moot court simulation where students argue complex legal and ethical cases before a panel of judges.

Whether you want to overcome stage fright, sharpen your critical thinking, or win a national debate championship, we have the coaching and community to help you get there. Our alumni have gone on to excel in law, politics, journalism, and corporate leadership.`,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    meetingDay: 'Every Monday & Friday, 4:00 PM',
    meetingLocation: 'Lecture Hall 3, Second Floor',
    memberCount: '55+ members',
  },
  {
    id: 5,
    name: 'Photography & Film Club',
    icon: <FiCamera size={32} />,
    description: 'Conducts photography walks, editing workshops, short film production, exhibitions and storytelling projects for creative visual media enthusiasts.',
    fullDescription: `The Photography & Film Club is a creative community for visual storytellers. We organize weekly photography walks around campus and the city, post-processing workshops in Adobe Lightroom and Premiere Pro, and end-of-semester exhibitions showcasing member work.

Our film division produces original short films, documentaries, and music videos — all written, directed, shot, and edited by members. We maintain a kit of DSLR cameras, lenses, lighting equipment, and audio gear available for member use.

We also collaborate with other clubs to document their events, giving our members real-world portfolio experience. Every semester we submit entries to regional and national student film festivals. Come in with any skill level — we'll help you develop your creative eye and technical craft.`,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    meetingDay: 'Every Saturday, 10:00 AM',
    meetingLocation: 'Media Lab, Ground Floor',
    memberCount: '60+ members',
  },
  {
    id: 6,
    name: 'Music & Performing Arts Club',
    icon: <FiMusic size={32} />,
    description: 'Hosts band rehearsals, choir practices, drama productions, open mic nights and cultural performances to develop musical and theatrical talents.',
    fullDescription: `The Music & Performing Arts Club is the cultural soul of our campus. We bring together singers, instrumentalists, actors, and dancers under one roof to create unforgettable performances.

Our activities include weekly band and choir rehearsals, biannual major drama productions (original scripts and classic adaptations), monthly open mic nights open to the entire campus community, and cultural showcase events celebrating the diversity of our student body.

We work with professional coaches to help members advance technically — whether in vocal training, instrument mastery, stage direction, or choreography. Members have performed at national youth festivals and university competitions. No audition required to join; all levels are welcome.`,
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    meetingDay: 'Tuesday & Thursday, 5:30 PM',
    meetingLocation: 'Auditorium / Music Room 2',
    memberCount: '95+ members',
  },
  {
    id: 7,
    name: 'Gaming & Esports Club',
    icon: <FiMonitor size={32} />,
    description: 'Organizes video game tournaments, streaming events, game development sessions and casual gaming meetups for gaming and esports enthusiasts.',
    fullDescription: `The Gaming & Esports Club is the go-to space for competitive and casual gamers alike. We run weekly gaming sessions across popular titles, monthly in-house tournaments with prize pools, and organized competitive teams that represent the university in inter-university esports leagues.

Beyond playing, we also have an active game development arm where members learn Unity and Unreal Engine to create their own games. We've produced several published mobile games from right here on campus.

Our streaming division teaches members how to set up professional streams, grow audiences, and monetize gaming content. Whether you're a hardcore competitive player or a casual fan who loves gaming culture, our community is welcoming and inclusive.`,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    meetingDay: 'Every Friday & Sunday, 3:00 PM',
    meetingLocation: 'Computer Lab A, Basement',
    memberCount: '110+ members',
  },
  {
    id: 8,
    name: 'Literature & Book Club',
    icon: <FiBookOpen size={32} />,
    description: 'Holds book discussions, creative writing sessions, poetry readings, author talks and literary events to promote reading and writing culture.',
    fullDescription: `The Literature & Book Club is a haven for readers, writers, and storytellers. Each month we choose a featured book — spanning fiction, non-fiction, African literature, philosophy, and more — followed by rich group discussions that explore themes, writing craft, and real-world implications.

Our creative writing workshops give members structured guidance on short stories, poetry, essays, and novel writing. We publish a biannual literary journal featuring the best student writing from across campus.

We also host author talks (in-person and virtual), poetry slam competitions, and participate in national literary festivals. If you love stories in any form — reading, writing, or listening — you'll feel right at home here.`,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    meetingDay: 'Every Wednesday, 4:00 PM',
    meetingLocation: 'Library Reading Room, Second Floor',
    memberCount: '50+ members',
  },
  {
    id: 9,
    name: 'Sports Analytics & Fitness Club',
    icon: <FiActivity size={32} />,
    description: 'Analyzes sports data, runs fitness challenges, organizes gym sessions, sports statistics workshops and health awareness activities.',
    fullDescription: `The Sports Analytics & Fitness Club merges the worlds of data science and physical wellness. On the analytics side, we analyze match data from major leagues using Python and R, build performance dashboards, and host workshops on sports statistics and predictive modeling.

On the fitness side, we run group gym sessions three times a week with trained student coaches, organize 5K charity runs, and run monthly fitness challenges with prizes. Our health awareness program covers nutrition, injury prevention, mental health, and recovery science.

Whether you're a stats nerd who wants to understand performance data, an athlete looking for a structured training community, or simply someone starting their fitness journey — we have something for you.`,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    meetingDay: 'Mon, Wed, Fri — 6:00 AM & 5:00 PM',
    meetingLocation: 'Campus Gym & Sports Analytics Lab',
    memberCount: '80+ members',
  },
  {
    id: 10,
    name: 'Community Service & Outreach Club',
    icon: <FiHeart size={32} />,
    description: 'Coordinates volunteer projects, charity drives, community education programs, blood donation campaigns and social impact initiatives.',
    fullDescription: `The Community Service & Outreach Club is driven by a simple belief: students have the power to change their communities. We coordinate monthly volunteer deployments to local schools, orphanages, and elderly care homes, run annual charity drives collecting food, clothing, and school supplies.

Our education outreach program sends university students to local primary and secondary schools to tutor students and inspire them toward higher education. We also partner with local hospitals for bi-annual blood donation campaigns.

Recent initiatives include a digital literacy program teaching basic computer skills to community members and a scholarship fundraising drive that has supported five students from disadvantaged backgrounds. Come join us if you want to make a real difference beyond the classroom.`,
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    meetingDay: 'Every Sunday, 9:00 AM',
    meetingLocation: 'Student Center, Ground Floor',
    memberCount: '100+ members',
  },
];

const Clubs: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 20px',
        color: 'white',
        position: 'relative',
      }}>
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
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
        >
          <FiArrowLeft size={18} />
          Back to Home
        </button>

        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            Clubs & Startups
          </div>
          <p style={{ fontSize: 20, opacity: 0.95, maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            Join our vibrant community of student organizations. Explore your passions, develop new skills, and make lasting connections.
          </p>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
              <FiUsers size={16} style={{ display: 'inline', marginRight: 6 }} />
              10 Active Clubs
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
              <FiCalendar size={16} style={{ display: 'inline', marginRight: 6 }} />
              Year-Round Activities
            </div>
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 30 }}>
          {clubs.map((club) => (
            <div
              key={club.id}
              style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
                border: '2px solid transparent',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = club.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              {/* Icon Header */}
              <div style={{ background: club.gradient, padding: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {club.icon}
              </div>

              {/* Content */}
              <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8, minHeight: 56 }}>
                  {club.name}
                </h3>

                {/* Meta info */}
                {(club.meetingDay || club.memberCount) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {club.memberCount && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                        <FiUsers size={11} /> {club.memberCount}
                      </span>
                    )}
                    {club.meetingLocation && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                        <FiMapPin size={11} /> {club.meetingLocation}
                      </span>
                    )}
                  </div>
                )}

                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6b7280', marginBottom: 20, flex: 1 }}>
                  {club.description}
                </p>

                {/* Two Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setSelectedClub(club)}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      background: 'white',
                      color: club.color,
                      border: `2px solid ${club.color}`,
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = club.color + '12'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <FiInfo size={14} /> Learn More
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      background: club.gradient,
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <FiArrowRight size={14} /> Join Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div style={{ marginTop: 60, background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
            Ready to Get Involved?
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
            Join any club that interests you! Create your account to register and start your campus journey.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/contact')}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FiMail size={18} /> Contact Us
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 28px',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Register to Join
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1f2937', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          All clubs meet regularly on campus. Check with individual clubs for meeting times and locations.
        </p>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
          from <strong>BLECAxmartlabs</strong>
        </p>
      </div>

      {/* ═══════════════ CLUB DETAIL MODAL ═══════════════ */}
      {selectedClub && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            zIndex: 9000,
            animation: 'fadeInOverlay 0.18s ease',
          }}
          onClick={() => setSelectedClub(null)}
        >
          <style>{`
            @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
            @keyframes slideUpModal { from{opacity:0;transform:scale(0.95) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
          `}</style>
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
              animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Gradient */}
            <div style={{
              background: selectedClub.gradient,
              padding: '32px 28px 24px',
              color: 'white',
              borderRadius: '24px 24px 0 0',
              position: 'relative',
            }}>
              <button
                onClick={() => setSelectedClub(null)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              >
                <FiX size={16} />
              </button>
              <div style={{ marginBottom: 12 }}>{selectedClub.icon}</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{selectedClub.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedClub.memberCount && (
                  <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiUsers size={11} /> {selectedClub.memberCount}
                  </span>
                )}
                {selectedClub.meetingDay && (
                  <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiCalendar size={11} /> {selectedClub.meetingDay}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 28 }}>
              {/* Meeting Location */}
              {selectedClub.meetingLocation && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderLeft: '4px solid #22c55e',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 20,
                }}>
                  <FiMapPin size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a', marginBottom: 3 }}>Meeting Location</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{selectedClub.meetingLocation}</div>
                  </div>
                </div>
              )}

              {/* Club Image placeholder */}
              <div style={{
                background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
                borderRadius: 12,
                height: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#94a3b8',
                marginBottom: 20,
                border: '2px dashed #cbd5e1',
              }}>
                <FiImage size={32} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Club photo will appear here once uploaded</span>
              </div>

              {/* Full Description */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>About This Club</h4>
                {selectedClub.fullDescription.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: '#4b5563', marginBottom: 14 }}>
                    {para.trim()}
                  </p>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => setSelectedClub(null)}
                  style={{
                    padding: '12px 20px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                >
                  Close
                </button>
                <button
                  onClick={() => { setSelectedClub(null); navigate('/register'); }}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: selectedClub.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: `0 4px 14px ${selectedClub.color}55`,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <FiArrowRight size={15} /> Register & Join {selectedClub.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clubs;