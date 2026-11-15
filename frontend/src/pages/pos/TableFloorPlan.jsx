import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext.jsx';
import posApi from '../../services/posApi.js';
import {
  Utensils,
  Wine,
  Tv,
  CircleDot,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

const AREA_LABELS = {
  main: { label: 'Main Dining Hall', icon: Utensils, desc: 'Family and casual dining tables' },
  bar: { label: 'Bar Counter', icon: Wine, desc: 'High-top seating for drinks and bar snacks' },
  billiards: { label: 'Billiards Lounge', icon: CircleDot, desc: 'Pool tables with guest seating' },
  ktv: { label: 'VIP KTV Rooms', icon: Tv, desc: 'Sound-proof private entertainment suites' },
};

export default function TableFloorPlan() {
  const navigate = useNavigate();
  const { tables, refreshTables, setActiveTable } = usePos();
  const [filterArea, setFilterArea] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const handleSelectTableForOrder = (table) => {
    setActiveTable(table);
    navigate('/pos/orders');
  };

  const handleQuickStatusChange = async (tableId, nextStatus) => {
    setUpdatingId(tableId);
    try {
      await posApi.updateTableStatus(tableId, nextStatus);
      await refreshTables();
    } catch (err) {
      alert(`Could not update table status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculation
  const totalTables = tables.length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const occupancyRate = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;

  const filteredTables = filterArea === 'all'
    ? tables
    : tables.filter((t) => t.area === filterArea);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return {
          bg: '#064e3b',
          border: '#059669',
          color: '#34d399',
          label: 'Available',
          dot: '#10b981',
        };
      case 'occupied':
        return {
          bg: '#450a0a',
          border: '#dc2626',
          color: '#f87171',
          label: 'Occupied',
          dot: '#ef4444',
        };
      case 'reserved':
        return {
          bg: '#451a03',
          border: '#d97706',
          color: '#fbbf24',
          label: 'Reserved',
          dot: '#f59e0b',
        };
      default:
        return {
          bg: '#1e293b',
          border: '#475569',
          color: '#94a3b8',
          label: status,
          dot: '#64748b',
        };
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#dc2626', fontWeight: 700 }}>
              Module B · Floor Operations
            </span>
            <span style={{ color: '#444' }}>•</span>
            <span style={{ fontSize: '11px', color: '#888' }}>Live Dining Floor Plan</span>
          </div>
          <h1 style={{ fontSize: '24px', margin: 0, color: '#fff', fontWeight: 800 }}>
            Table Seating & Room Status
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: '6px 0 0' }}>
            Check table occupancy, inspect reservations, and dispatch customer orders directly to floor tables.
          </p>
        </div>

        <button
          onClick={refreshTables}
          className="secondary-button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Floor</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Tables / Rooms
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            {totalTables}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
            Across 4 dining zones
          </div>
        </div>

        <div style={{ background: '#141414', border: '1px solid #064e3b', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Available for Seating
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {availableCount}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            Ready to take orders
          </div>
        </div>

        <div style={{ background: '#141414', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Currently Occupied
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {occupiedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px' }}>
            Active dining / bills in progress
          </div>
        </div>

        <div style={{ background: '#141414', border: '1px solid #78350f', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Reserved / Queued
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {reservedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>
            Floor occupancy: {occupancyRate}%
          </div>
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '12px' }}>
        {[
          { id: 'all', label: 'All Floor Zones' },
          { id: 'main', label: 'Main Dining' },
          { id: 'bar', label: 'Bar Counter' },
          { id: 'billiards', label: 'Billiards Lounge' },
          { id: 'ktv', label: 'VIP KTV Rooms' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterArea(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: filterArea === tab.id ? '#8b0000' : 'transparent',
              background: filterArea === tab.id ? '#8b0000' : '#141414',
              color: filterArea === tab.id ? '#fff' : '#888',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredTables.map((table) => {
          const badge = getStatusBadge(table.status);
          const AreaIcon = AREA_LABELS[table.area]?.icon || Utensils;
          const isBusy = updatingId === table.id;

          return (
            <div
              key={table.id}
              style={{
                background: '#141414',
                border: `1px solid ${table.status === 'occupied' ? '#450a0a' : table.status === 'reserved' ? '#451a03' : '#222'}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div>
                {/* Header: Number and Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <AreaIcon size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>
                        {table.table_number}
                      </h3>
                      <small style={{ fontSize: '11px', color: '#888' }}>
                        {AREA_LABELS[table.area]?.label}
                      </small>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      color: badge.color,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: badge.dot,
                      }}
                    />
                    {badge.label}
                  </span>
                </div>

                {/* Meta details: Capacity and Reservation info */}
                <div style={{ background: '#0e0e0e', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#666" />
                      <span>Capacity:</span>
                    </span>
                    <strong style={{ color: '#fff' }}>{table.capacity} guests</strong>
                  </div>

                  {table.reserved_by && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fbbf24', marginTop: '6px', borderTop: '1px solid #222', paddingTop: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span>Reserved for:</span>
                      </span>
                      <strong>{table.reserved_by} ({table.reservation_time?.slice(0, 5)})</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleSelectTableForOrder(table)}
                  className="primary-button"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Take Order / Open Bill</span>
                  <ArrowRight size={14} />
                </button>

                {/* Quick Status Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    disabled={isBusy || table.status === 'available'}
                    onClick={() => handleQuickStatusChange(table.id, 'available')}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: table.status === 'available' ? '#064e3b' : '#1a1a1a',
                      color: table.status === 'available' ? '#34d399' : '#888',
                      border: '1px solid #333',
                      cursor: table.status === 'available' ? 'default' : 'pointer',
                    }}
                  >
                    Available
                  </button>
                  <button
                    disabled={isBusy || table.status === 'occupied'}
                    onClick={() => handleQuickStatusChange(table.id, 'occupied')}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: table.status === 'occupied' ? '#450a0a' : '#1a1a1a',
                      color: table.status === 'occupied' ? '#f87171' : '#888',
                      border: '1px solid #333',
                      cursor: table.status === 'occupied' ? 'default' : 'pointer',
                    }}
                  >
                    Occupied
                  </button>
                  <button
                    disabled={isBusy || table.status === 'reserved'}
                    onClick={() => handleQuickStatusChange(table.id, 'reserved')}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: table.status === 'reserved' ? '#451a03' : '#1a1a1a',
                      color: table.status === 'reserved' ? '#fbbf24' : '#888',
                      border: '1px solid #333',
                      cursor: table.status === 'reserved' ? 'default' : 'pointer',
                    }}
                  >
                    Reserved
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
