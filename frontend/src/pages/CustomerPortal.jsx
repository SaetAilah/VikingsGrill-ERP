import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Calendar,
  UtensilsCrossed,
  Star,
  LogOut,
  ExternalLink,
  Award,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function CustomerPortal() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #090d16 0%, #151d2f 50%, #0d131f 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px 20px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(185, 28, 28, 0.4)',
            }}>
              VG
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
                VIKINGS GRILL
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Customer Dining & Experience Portal
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{user?.name || 'Valued Guest'}</div>
              <div style={{ fontSize: '12px', color: '#38bdf8' }}>Verified Diner Account</div>
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Hero Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.35), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '10px',
            }}>
              <Sparkles size={13} />
              <span>Mabuhay & Welcome to Vikings Grill</span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800 }}>
              Hello, {user?.name?.split(' ')[0] || 'Diner'}!
            </h2>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px', maxWidth: '580px', lineHeight: 1.5 }}>
              Manage your reservations, browse our Roxas Oriental Mindoro specialty grill menu, track your dining table queue, and share your dining feedback.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Award size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Loyalty Points</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>150 pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Self-Service Modules Grid */}
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#e2e8f0' }}>
          Customer Dining Services
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}>
          {/* Card 1: Online Table Reservation */}
          <div style={{
            background: '#151d2f',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s, border-color 0.2s',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Calendar size={22} />
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
                Table Reservation & Queue
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Book dining tables, reserve Billiards or KTV rooms in advance, and check live queue position at Vikings Grill.
              </p>
            </div>
            <a
              href="http://localhost:5176"
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span>Open Reservation Portal</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Card 2: Digital Food & Drink Menu */}
          <div style={{
            background: '#151d2f',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <UtensilsCrossed size={22} />
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
                Digital Menu & Ordering
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Explore Grilled Pork Belly, Chicken Inasal, KTV Party Packages, and order directly from your mobile table QR code.
              </p>
            </div>
            <a
              href="http://localhost:5176"
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span>Explore Food & Drink Menu</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Card 3: Customer Feedback & Reviews */}
          <div style={{
            background: '#151d2f',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#f472b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Star size={22} />
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
                Customer Feedback & CRM
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Rate your dining experience, submit service feedback, and earn points on your customer loyalty profile.
              </p>
            </div>
            <a
              href="http://localhost:5178"
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #db2777, #be185d)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span>Submit Dining Review</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Location & Contact Footer Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: '#94a3b8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="#ef4444" />
            <span>Vikings Grill, Roxas, Oriental Mindoro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#38bdf8" />
            <span>Open Daily: 10:00 AM – 11:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
