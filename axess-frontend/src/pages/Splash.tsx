// src/pages/Splash.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('authToken');
      const user  = localStorage.getItem('currentUser');
      const isLoggedIn = !!token && !!user;
      // ✅ Logged-in  → dashboard
      // ✅ Guest      → home landing page (not login)
      navigate(isLoggedIn ? '/dashboard' : '/home', { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <img
        src="/images/logo.png"
        alt="aXess Logo"
        style={{
          width: 'clamp(30px, 40vw, 190px)',
          height: 'auto', objectFit: 'contain',
          userSelect: 'none', pointerEvents: 'none',
          animation: 'splashFadeIn 0.8s ease-in-out both',
          filter: 'drop-shadw(0 10px 30px rgba(0,0,0,0.3))',
          marginTop: '-250px',
          borderRadius:'15px',
        }}
      />

      <div style={{
        position: 'absolute', bottom: '40px', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '10px', whiteSpace: 'nowrap',
      }}>
        <span style={{ color:'white', fontSize:'13px', fontWeight:400, opacity:0.8, letterSpacing:'0.5px' }}>
          from
        </span>
        <strong style={{ color:'white', fontSize:'20px', fontWeight:700, opacity:1, letterSpacing:'0.5px' }}>
          BLECAxmartlabs
        </strong>
        <div style={{ display:'flex', gap:'10px', alignItems:'center', marginTop:'4px' }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width:'8px', height:'8px', borderRadius:'50%', background:'white', display:'block',
              animation:'bounceDot 1.4s ease-in-out infinite',
              animationDelay:`${i * 0.16}s`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splashFadeIn {
          0%   { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40%            { transform: translateY(-20px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Splash;