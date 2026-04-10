import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { DELIVERY_STATUSES } from '../data/mockData.js';

/*
  UserDashboardExtras — renders additional sections for the user dashboard:
  - My Memories
  - Scheduled Surprises
  - Orders / Deliveries Tracking
  These are designed to be placed inside the existing user page/heartbox overlay.
*/

export default function UserDashboardExtras({ onNavigate }) {
  const { getUserMemories, getUserSurprises, getUserOrders, currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState('memories');

  const memories = getUserMemories();
  const surprises = getUserSurprises();
  const userOrders = getUserOrders();

  const sections = [
    { id: 'memories', label: 'My Memories', icon: '💭', count: memories.length },
    { id: 'surprises', label: 'Scheduled Surprises', icon: '🎁', count: surprises.length },
    { id: 'orders', label: 'Orders & Tracking', icon: '📦', count: userOrders.length },
    { id: 'safety', label: 'Safety System', icon: '🛡️', count: 1 },
  ];

  const getStatusColor = (status) => {
    const found = DELIVERY_STATUSES.find(d => d.value === status);
    return found?.color || '#5a7a50';
  };

  return (
    <div className="user-extras-wrapper">
      {/* Section bar */}
      <div className="user-extras-tabs">
        {sections.map(sec => (
          <button
            key={sec.id}
            className={`user-extras-tab${activeSection === sec.id ? ' active' : ''}`}
            onClick={() => setActiveSection(sec.id)}
          >
            <span className="extra-tab-icon">{sec.icon}</span>
            <span>{sec.label}</span>
            <span className="extra-tab-count">{sec.count}</span>
          </button>
        ))}
      </div>

      {/* ── MY MEMORIES ── */}
      {activeSection === 'memories' && (
        <div className="user-extras-section">
          <div className="content-hero content-hero-write" style={{ marginBottom: '1rem' }}>
            <h3>💭 My Memories</h3>
            <p>All the heartfelt memories you've saved for your loved ones.</p>
          </div>
          {memories.length === 0 ? (
            <div className="shop-empty-state">
              <span className="shop-empty-icon">💭</span>
              <p>No memories saved yet. Start creating memories to see them here!</p>
            </div>
          ) : (
            <div className="user-extras-grid">
              {memories.map((mem, idx) => (
                <div key={mem._id || mem.id || idx} className="user-memory-card">
                  <div className="user-memory-type">
                    {mem.type === 'message' ? '✉️' : mem.type === 'media' ? '🎬' : '🌸'}
                  </div>
                  <div className="user-memory-info">
                    <h4>{mem.title}</h4>
                    <p>{mem.content}</p>
                    <div className="user-memory-meta">
                      <span className="user-memory-occasion">{mem.occasion}</span>
                      <span className="user-memory-date">📅 {mem.date}</span>
                      <span className={`user-memory-status status-chip-${mem.status}`}>
                        {mem.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCHEDULED SURPRISES ── */}
      {activeSection === 'surprises' && (
        <div className="user-extras-section">
          <div className="content-hero content-hero-gifts" style={{ marginBottom: '1rem' }}>
            <h3>🎁 Scheduled Surprises</h3>
            <p>Track upcoming and delivered surprise gifts for your loved ones.</p>
          </div>
          {surprises.length === 0 ? (
            <div className="shop-empty-state">
              <span className="shop-empty-icon">🎁</span>
              <p>No surprises scheduled yet. Plan a surprise today!</p>
            </div>
          ) : (
            <div className="user-extras-grid">
              {surprises.map((sur, idx) => (
                <div key={sur._id || sur.id || idx} className="user-surprise-card">
                  <div className="user-surprise-image">{sur.image}</div>
                  <div className="user-surprise-info">
                    <h4>{sur.giftType}</h4>
                    <p className="user-surprise-recipient">For: <strong>{sur.recipientName}</strong></p>
                    <p className="user-surprise-shop">From: {sur.shopName}</p>
                    {sur.note && <p className="user-surprise-note">💬 "{sur.note}"</p>}
                    <div className="user-surprise-meta">
                      <span>📅 {sur.scheduledDate}</span>
                      <span className={`user-memory-status status-chip-${sur.status}`}>
                        {sur.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS & DELIVERIES ── */}
      {activeSection === 'orders' && (
        <div className="user-extras-section">
          <div className="content-hero content-hero-media" style={{ marginBottom: '1rem' }}>
            <h3>📦 Orders & Deliveries</h3>
            <p>Track the status of all your gift orders in real time.</p>
          </div>
          {userOrders.length === 0 ? (
            <div className="shop-empty-state">
              <span className="shop-empty-icon">📦</span>
              <p>No orders yet. Your orders will appear here once you place them.</p>
            </div>
          ) : (
            <div className="user-orders-list">
              {userOrders.map((order, idx) => (
                <div key={order._id || order.id || idx} className="user-order-card">
                  <div className="user-order-header">
                    <span className="user-order-id">Order #{order.id}</span>
                    <span className={`shop-order-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="user-order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="user-order-item">
                        <span>{item.image} {item.name}</span>
                        <span>×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="user-order-footer">
                    <span className="user-order-total">Total: <strong>${order.total.toFixed(2)}</strong></span>
                    <div className="user-order-delivery">
                      <div className="delivery-progress-bar">
                        <div
                          className="delivery-progress-fill"
                          style={{
                            width: order.deliveryStatus === 'pending' ? '10%'
                              : order.deliveryStatus === 'preparing' ? '30%'
                              : order.deliveryStatus === 'shipped' ? '55%'
                              : order.deliveryStatus === 'out-for-delivery' ? '80%'
                              : order.deliveryStatus === 'delivered' ? '100%'
                              : '0%',
                            background: getStatusColor(order.deliveryStatus),
                          }}
                        />
                      </div>
                      <span className="delivery-status-text" style={{ color: getStatusColor(order.deliveryStatus) }}>
                        {DELIVERY_STATUSES.find(d => d.value === order.deliveryStatus)?.label || order.deliveryStatus}
                      </span>
                    </div>
                    {order.occasion && <span className="user-order-occasion">{order.occasion} · {order.date}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SAFETY SYSTEM ── */}
      {activeSection === 'safety' && (
        <div className="user-extras-section">
          <div className="content-hero content-hero-safe" style={{ marginBottom: '1rem' }}>
            <h3>🛡️ Memory Safety System</h3>
            <p>Your legacy is protected by our automated inactivity monitoring and verification pipeline.</p>
          </div>

          <div className="safety-view-grid">
            <div className="safety-card safety-status-card">
              <h4>Current Status</h4>
              <div className="safety-status-badge ACTIVE">
                <span className="pulse-dot"></span>
                Monitoring Active
              </div>
              <p className="safety-stat-detail">Last check: <span>Just now</span></p>
              <p className="safety-stat-detail">Last visit: <span>{new Date(currentUser?.lastVisit || Date.now()).toLocaleDateString()}</span></p>
            </div>

            <div className="safety-card safety-config-card">
              <h4>Monitoring Logic</h4>
              <div className="safety-config-item">
                <span className="cfg-label">Inactivity Window:</span>
                <span className="cfg-value">2 months</span>
              </div>
              <div className="safety-config-item">
                <span className="cfg-label">Detection Method:</span>
                <span className="cfg-value">Login & Activity Tracking</span>
              </div>
              <div className="safety-config-item">
                <span className="cfg-label">Emergency Contact:</span>
                <span className="cfg-value">{currentUser?.emergencyContact?.name || 'Vandana'} ({currentUser?.emergencyContact?.relation || 'Family'})</span>
              </div>
            </div>
          </div>

          <div className="safety-pipeline-visual">
            <h4>Verification Pipeline</h4>
            <p className="pipeline-desc">If inactivity is detected, we follow this sequence before delivering any memories.</p>
            
            <div className="pipeline-timeline">
              <div className="pipeline-event active">
                <div className="event-icon">📧</div>
                <div className="event-info">
                  <strong>Email Check</strong>
                  <span>Sent 2 months after inactivity</span>
                </div>
              </div>
              <div className="pipeline-connector"></div>
              <div className="pipeline-event">
                <div className="event-icon">💬</div>
                <div className="event-info">
                  <strong>WhatsApp Ping</strong>
                  <span>3 days after no email response</span>
                </div>
              </div>
              <div className="pipeline-connector"></div>
              <div className="pipeline-event">
                <div className="event-icon">🤖</div>
                <div className="event-info">
                  <strong>AI Voice Call</strong>
                  <span>5 days after no WhatsApp response</span>
                </div>
              </div>
              <div className="pipeline-connector"></div>
              <div className="pipeline-event delivery">
                <div className="event-icon">📦</div>
                <div className="event-info">
                  <strong>Memory Delivery</strong>
                  <span>Triggered only if all checks fail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
