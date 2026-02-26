// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import { dashboardAPI } from '../lib/api';
import Badge from '../components/ui/Badge';
import { Icons } from '../components/icons';

interface DashboardStats {
  totalMembers: number;
  pendingVerifications: number;
  totalRooms: number;
  availableRooms: number;
  totalRequests: number;
  pendingRequests: number;
  totalReports: number;
  openReports: number;
  weeklyRequests: Array<{ name: string; value: number }>;
  monthlyData: Array<{ name: string; requests: number; users: number }>;
  topRooms: Array<{ name: string; code: string; count: number }>;
  requestStatusBreakdown: {
    pending: number;
    approved: number;
    returned: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Read user role from localStorage ───────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        setIsAdmin(u.role === 'admin');
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="form-error" role="alert">
          {error}
        </div>
        <button onClick={loadStats} className="save-btn" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return <div style={{ padding: '2rem' }}>No data available</div>;
  }

  return (
    <>
      <h1 className="section-title">Overview</h1>

      <div className="stat-cards">
        {/* ── Total Users: admin only can click ── */}
        <StatCard
          type="users"
          value={stats.totalMembers.toLocaleString()}
          label="Total Users"
          color="blue"
          notifications={stats.pendingVerifications}
          onClick={isAdmin ? () => navigate('/members') : undefined}
        />

        {/* ── Total Rooms: admin only can click ── */}
        <StatCard
          type="rooms"
          value={stats.totalRooms.toLocaleString()}
          label="Total Rooms"
          color="green"
          notifications={stats.totalRooms - stats.availableRooms}
          onClick={isAdmin ? () => navigate('/rooms') : undefined}
        />

        {/* ── Total Requests: all users can click (it's their own requests page) ── */}
        <StatCard
          type="requests"
          value={stats.totalRequests.toLocaleString()}
          label="Total Requests"
          color="orange"
          notifications={stats.pendingRequests}
          onClick={() => navigate('/requests')}
        />

        {/* ── Total Reports: admin only can click ── */}
        <StatCard
          type="reports"
          value={stats.totalReports.toLocaleString()}
          label="Total Reports"
          color="gray"
          notifications={stats.openReports}
          onClick={isAdmin ? () => navigate('/reports') : undefined}
        />
      </div>

      <div className="chart-cards">
        <ChartCard
          type="bar"
          title="Weekly Requests"
          data={stats.weeklyRequests}
          dropdown="Last 7 Days"
        />
        <ChartCard
          type="line"
          title="Monthly Overview"
          data={stats.monthlyData}
          dropdown="Last 6 Months"
        />
      </div>

      {/* Analytics Section */}
      <div className="role-previews">
        {/* Request Status Overview */}
        <div className="role-section">
          <div className="role-title">
            Request Status Overview <Icons.Info size={16} />
          </div>
          <div className="status-cards">
            <div className="status-card orange">
              <Badge variant="pending">Pending</Badge>
              <div className="status-detail" style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {stats.requestStatusBreakdown.pending}
              </div>
              <div className="status-detail" style={{ color: 'var(--muted-text)' }}>
                Awaiting Approval
              </div>
            </div>
            <div className="status-card green">
              <Badge variant="approved">Approved</Badge>
              <div className="status-detail" style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {stats.requestStatusBreakdown.approved}
              </div>
              <div className="status-detail" style={{ color: 'var(--muted-text)' }}>
                Currently Active
              </div>
            </div>
            <div className="status-card blue">
              <Badge variant="returned">Returned</Badge>
              <div className="status-detail" style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {stats.requestStatusBreakdown.returned}
              </div>
              <div className="status-detail" style={{ color: 'var(--muted-text)' }}>
                Completed
              </div>
            </div>
            <div className="status-card gray">
              <Badge variant="restricted">Total</Badge>
              <div className="status-detail" style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {stats.totalRequests}
              </div>
              <div className="status-detail" style={{ color: 'var(--muted-text)' }}>
                All Requests
              </div>
            </div>
          </div>
        </div>

        {/* Top Rooms */}
        <div className="role-section">
          <div className="role-title">Most Requested Rooms</div>
          {stats.topRooms.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-text)' }}>
              No room requests yet
            </div>
          ) : (
            <table className="innovator-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room Name</th>
                  <th>Code</th>
                  <th>Total Requests</th>
                  <th>Popularity</th>
                </tr>
              </thead>
              <tbody>
                {stats.topRooms.map((room, index) => {
                  const maxCount = stats.topRooms[0]?.count || 1;
                  const percentage = Math.round((room.count / maxCount) * 100);

                  return (
                    <tr key={index}>
                      <td style={{ fontWeight: 'bold', color: 'var(--soft-blue-dark)' }}>
                        {index + 1}
                      </td>
                      <td>{room.name}</td>
                      <td>
                        <Badge variant="available">{room.code}</Badge>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{room.count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            background: '#f0f0f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              background: 'var(--soft-blue-dark)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--muted-text)', minWidth: '40px' }}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Room Availability */}
        <div className="role-section">
          <div className="role-title">Room Availability</div>
          <div className="guard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--muted-text)', marginBottom: '4px' }}>
                  Available Rooms
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                  {stats.availableRooms}
                </div>
              </div>
              <Icons.CheckCircle size={48} color="#10b981" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--muted-text)', marginBottom: '4px' }}>
                  Occupied Rooms
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {stats.totalRooms - stats.availableRooms}
                </div>
              </div>
              <Icons.Lock size={48} color="#f59e0b" />
            </div>

            <div style={{
              marginTop: '8px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Availability Rate</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--soft-blue-dark)' }}>
                {stats.totalRooms > 0
                  ? Math.round((stats.availableRooms / stats.totalRooms) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;