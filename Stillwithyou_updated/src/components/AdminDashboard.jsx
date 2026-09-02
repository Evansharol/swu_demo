import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Hardcoded dummy shops — always visible on map, zero backend dependency
const DUMMY_SHOPS = [
  { id: 'd1',  name: 'Rose Petal Florist',  type: 'flowers',   emoji: '🌸', lat: 11.006, lng: 76.945 },
  { id: 'd2',  name: 'Bloom Boutique',       type: 'flowers',   emoji: '🌸', lat: 11.034, lng: 76.942 },
  { id: 'd3',  name: 'Floral Aura',          type: 'flowers',   emoji: '🌸', lat: 11.011, lng: 76.966 },
  { id: 'd4',  name: 'Eden Flowers',         type: 'flowers',   emoji: '🌸', lat: 10.998, lng: 77.021 },
  { id: 'd5',  name: 'Dream Florals',        type: 'flowers',   emoji: '🌸', lat: 11.041, lng: 76.985 },
  { id: 'd6',  name: 'Choco Delights',       type: 'chocolate', emoji: '🍫', lat: 11.001, lng: 76.974 },
  { id: 'd7',  name: 'Cocoa Bean',           type: 'chocolate', emoji: '🍫', lat: 11.018, lng: 76.969 },
  { id: 'd8',  name: 'Choco Bliss',          type: 'chocolate', emoji: '🍫', lat: 11.022, lng: 76.899 },
  { id: 'd9',  name: 'Truffle Town',         type: 'chocolate', emoji: '🍫', lat: 11.008, lng: 76.958 },
  { id: 'd10', name: 'Cakes & Co',           type: 'cakes',     emoji: '🎂', lat: 11.021, lng: 76.992 },
  { id: 'd11', name: 'Sugar Rush Bakery',    type: 'cakes',     emoji: '🎂', lat: 11.026, lng: 77.012 },
  { id: 'd12', name: 'The Cake Lab',         type: 'cakes',     emoji: '🎂', lat: 11.077, lng: 77.025 },
];

const TABS = [
  { id: 'overview',    label: 'Platform Overview', icon: '📊' },
  { id: 'users',       label: 'User Management',   icon: '👥' },
  { id: 'logistics',   label: 'Local Logistics',   icon: '📍' },
  { id: 'fulfillment', label: 'Fulfillment Logs',  icon: '🚚' },
  { id: 'settings',    label: 'System Settings',   icon: '⚙️' },
];

function ShopMap({ selectedShopIds, onToggleShop, deliveryTarget, activeCategory, allUsers }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);

  // Initialize map ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, { zoomControl: true }).setView([11.016, 76.966], 13);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO'
    }).addTo(map);

    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 400);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers (strictly filtered by category and linked to real DB IDs)
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    // ONLY render shops that match the delivery category
    const relevantShops = DUMMY_SHOPS.filter(s => s.type === activeCategory);

    relevantShops.forEach(shop => {
      // Find the REAL user ID from the database that matches this dummy shop name
      const realShopUser = allUsers.find(u => 
        u.role === 'shop' && 
        (u.shopProfile?.businessName === shop.name || u.name === shop.name)
      );
      
      const realId = realShopUser?._id || shop.id;
      const isSel = selectedShopIds.includes(realId.toString());
      const bg = isSel ? '#1890c0' : (shop.type === 'flowers' ? '#b5397a' : shop.type === 'chocolate' ? '#6b3a10' : '#b56d1d');

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
            <div style="background:${bg};border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:3.5px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.2);position:relative;transform:${isSel ? 'scale(1.15)' : 'scale(1)'};transition:transform 0.2s;">
              <span style="font-size:22px;line-height:1;">${shop.emoji}</span>
              ${isSel ? '<div style="position:absolute;top:-8px;right:-8px;background:#2ecc71;border-radius:50%;width:22px;height:22px;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;">✓</div>' : ''}
            </div>
            <div style="margin-top:7px;font-size:12px;font-weight:900;background:#fff;padding:4px 9px;border-radius:10px;border:2.5px solid ${bg};white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.1);color:#111;">
              ${shop.name}
            </div>
          </div>`,
        iconSize:   [110, 80],
        iconAnchor: [55, 40],
      });

      L.marker([shop.lat, shop.lng], { icon })
        .addTo(layerRef.current)
        .bindPopup(`
          <div style="padding:10px;min-width:180px;text-align:center;font-family:inherit;">
             <div style="font-size:36px;margin-bottom:8px;">${shop.emoji}</div>
             <strong style="display:block;font-size:1.1rem;margin-bottom:12px;">${shop.name}</strong>
             <button onclick="window._adminToggleShop && window._adminToggleShop('${realId}')"
               style="width:100%;padding:10px;background:${isSel ? '#e74c3c' : '#5aaa38'};color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:800;font-size:.9rem;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
               ${isSel ? '✕ Deselect' : '✓ Select This Partner'}
             </button>
          </div>
        `, { offset: [0, -20] });
    });

    // Target
    if (deliveryTarget) {
      const targetIcon = L.divIcon({
        className: '',
        html: `<div style="background:#e67e22;border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;border:4.5px solid #fff;box-shadow:0 10px 35px rgba(230,126,34,0.5);font-size:28px;animation:pulse 1.8s infinite;">🎁</div>`,
        iconSize: [52, 52], iconAnchor: [26, 26],
      });
      L.marker([deliveryTarget.lat, deliveryTarget.lng], { icon: targetIcon, zIndexOffset: 2000 })
        .addTo(layerRef.current)
        .bindPopup(`<strong>📍 Delivery Destination</strong><br/>For: ${deliveryTarget.name}`);
    }
  }, [selectedShopIds, deliveryTarget, activeCategory, allUsers]);

  // Expose toggle via global bridge
  useEffect(() => {
    window._adminToggleShop = onToggleShop;
    return () => { delete window._adminToggleShop; };
  }, [onToggleShop]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const { currentUser, logout, surprises, getAllUsers, getFulfillmentLogs } = useAuth();

  const [activeTab,            setActiveTab]            = useState('overview');
  const [viewMode,             setViewMode]             = useState('list');
  const [toast,                setToast]                = useState('');
  const [selectedSurprise,     setSelectedSurprise]     = useState(null);
  const [selectedShopIds,      setSelectedShopIds]      = useState([]);
  const [showConfirm,          setShowConfirm]          = useState(false);

  const allUsers = getAllUsers();
  const logs     = getFulfillmentLogs();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleAdminLogout = () => {
    if (onLogout) onLogout(); else { logout(); navigate('/'); }
  };

  const stats = useMemo(() => ({
    total:       allUsers.length,
    active:      allUsers.filter(u => u.deliveryStatus === 'active').length,
    monitoring:  allUsers.filter(u => u.deliveryStatus === 'monitoring').length,
    fulfillments: logs.length,
  }), [allUsers, logs]);

  const handleToggleShop = (id) => {
    setSelectedShopIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) { showToast('Max 3 partners.'); return prev; }
      return [...prev, id];
    });
  };

  const handleMatchOnMap = async (surprise) => {
    setSelectedSurprise(surprise);
    setSelectedShopIds([]); // Fresh reset for every new match
    setViewMode('map');
    
    const token = localStorage.getItem('token');
    const type  = surprise.category || 'flowers';
    
    try {
      const [lng, lat] = surprise.deliveryLocation.coordinates;
      const res  = await fetch(`/api/shops/match?lng=${lng}&lat=${lat}&type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        // Double-check the types returned by backend just in case
        const matchedIds = data.data
          .filter(s => s.shopProfile?.businessType === type)
          .slice(0, 3)
          .map(s => s._id);
          
        setSelectedShopIds(matchedIds);
      } else {
        const filtered = DUMMY_SHOPS.filter(s => s.type === type);
        const mappedIds = filtered.slice(0, 3).map(s => {
          const real = allUsers.find(u => u.name === s.name || u.shopProfile?.businessName === s.name);
          return real?._id || s.id;
        });
        setSelectedShopIds(mappedIds);
      }
    } catch {
      const type = surprise.category || 'flowers';
      const filtered = DUMMY_SHOPS.filter(s => s.type === type);
      const mappedIds = filtered.slice(0, 3).map(s => {
        const real = allUsers.find(u => u.name === s.name || u.shopProfile?.businessName === s.name);
        return real?._id || s.id;
      });
      setSelectedShopIds(mappedIds);
    }
  };

  const executeBroadcast = async () => {
    const token = localStorage.getItem('token');
    
    // Collect real names from DUMMY_SHOPS for any dummy IDs (the backend will resolve them)
    const shopNames = selectedShopIds.map(id => {
      const dummy = DUMMY_SHOPS.find(d => d.id.toString() === id.toString());
      if (dummy) return dummy.name;
      const real = allUsers.find(u => u._id.toString() === id.toString());
      return real?.shopProfile?.businessName || real?.name || null;
    }).filter(Boolean);
    
    try {
      const res = await fetch('/api/shops/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          surpriseId: selectedSurprise._id, 
          shopIds: selectedShopIds,
          shopNames  // send names as fallback for dummy IDs
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Broadcast sent to ${data.shopCount || 1} partner(s)!`);
        setSelectedSurprise(null);
        setViewMode('list');
        setShowConfirm(false);
      } else {
        showToast(`❌ ${data.message || 'Broadcast failed. Check server logs.'}`);
        setShowConfirm(false);
      }
    } catch { showToast('❌ Network error sending broadcast.'); }
  };

  const deliveryTarget = selectedSurprise?.deliveryLocation
    ? {
        lat:  selectedSurprise.deliveryLocation.coordinates[1],
        lng:  selectedSurprise.deliveryLocation.coordinates[0],
        name: selectedSurprise.recipientName,
      }
    : null;

  const trendData = [
    { n: 'W1', v: 40 }, { n: 'W2', v: 85 }, { n: 'W3', v: 60 },
    { n: 'W4', v: 130 }, { n: 'W5', v: 100 },
  ];

  return (
    <div className="shop-dashboard-wrapper">
      {toast && <div className="save-toast" style={{ zIndex: 1000 }}>{toast}</div>}

      <nav>
        <div className="logo">Still <em>With You</em> Admin</div>
        <div className="nav-user-area">
          <div className="user-badge" onClick={handleAdminLogout} style={{ cursor: 'pointer' }}>
            <div className="live-dot" />
            <span>{currentUser?.name} (Admin)</span>
          </div>
          <button className="btn-logout" onClick={handleAdminLogout}>Logout</button>
        </div>
      </nav>

      <div className="shop-layout">
        <aside className="shop-sidebar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`shop-side-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i>{tab.icon}</i> {tab.label}
            </button>
          ))}
        </aside>

        <main className="shop-main-content">
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              <header className="shop-header-intro">
                <h1>Platform Overview</h1>
                <p>Real-time metrics and community engagement trends.</p>
              </header>
              <div className="shop-stats-grid">
                {[
                  { label: 'Registered',   value: stats.total,        icon: '👥' },
                  { label: 'Active',        value: stats.active,       icon: '🌿', color: '#5aaa38' },
                  { label: 'Monitoring',    value: stats.monitoring,   icon: '⚠️', color: '#c07820' },
                  { label: 'Fulfillments',  value: stats.fulfillments, icon: '🚚', color: '#1890c0' },
                ].map((s, i) => (
                  <div key={i} className="shop-stat-card">
                    <div className="shop-stat-icon">{s.icon}</div>
                    <div>
                      <div className="shop-stat-value" style={{ color: s.color || '#2a4020' }}>{s.value}</div>
                      <div className="shop-stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed chart container */}
              <div style={{ marginTop: '3rem', background: '#fff', borderRadius: '28px', border: '1px solid #f0f0f0', padding: '2rem', boxShadow:'0 4px 24px rgba(0,0,0,0.02)' }}>
                <h4 style={{ marginBottom: '1.5rem', color: '#1a331a', fontSize:'1.2rem', fontWeight:800 }}>Weekly Engagement</h4>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill: '#8a9a8a', fontSize: 12}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="v" stroke="#5aaa38" fill="url(#colorGreen)" fillOpacity={1} strokeWidth={4} />
                      <defs>
                        <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5aaa38" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#5aaa38" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <>
              <header className="shop-header-intro">
                <h1>User Management</h1>
                <p>Manage community members and partner accounts.</p>
              </header>
              <div className="orders-container" style={{ marginTop: '2rem' }}>
                {allUsers.map(u => (
                  <div key={u._id} className="order-card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="order-recipient">
                      <strong>{u.name}</strong>
                      <span>{u.email}</span>
                    </div>
                    <span className="stock-badge in-stock">{u.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── LOGISTICS ── */}
          {activeTab === 'logistics' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <header className="shop-header-intro" style={{ margin: 0 }}>
                  <h1>Logistics Control</h1>
                  <p>Smart matching for flower, chocolate, and cake deliveries.</p>
                </header>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setViewMode('list'); setSelectedSurprise(null); }}
                    className={`shop-side-tab ${viewMode === 'list' ? 'active' : ''}`}
                    style={{ padding: '0.6rem 1.5rem' }}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`shop-side-tab ${viewMode === 'map' ? 'active' : ''}`}
                    style={{ padding: '0.6rem 1.5rem' }}
                  >
                    Map
                  </button>
                </div>
              </div>

              {viewMode === 'list' ? (
                <div className="orders-container">
                  {surprises.filter(s => s.status !== 'delivered').length === 0 && (
                    <div className="empty-box">
                       <span className="empty-icon">☕</span>
                       <p>All logistics tasks are completed.</p>
                    </div>
                  )}
                  {surprises.filter(s => s.status !== 'delivered').map(sur => {
                    const orderUser = sur.userId;
                    return (
                      <div key={sur._id} className="order-card-premium">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '2rem', alignItems: 'center' }}>
                          <div className="order-recipient">
                            <strong>{sur.giftType}</strong>
                            <span>User: {orderUser?.name || 'Unknown'}</span>
                          </div>

                          <div className="order-details-pills">
                            <div className="detail-pill">📅 {new Date(sur.scheduledDate).toLocaleDateString()}</div>
                            <div className="detail-pill">🎁 {sur.recipientName}</div>
                            <div className="detail-pill" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {sur.deliveryAddress}</div>
                          </div>

                          <button className="btn-accept" onClick={() => handleMatchOnMap(sur)} style={{ minWidth: '180px' }}>
                            🗺️ Match on Map
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ position: 'relative', height: '600px', borderRadius: '32px', overflow: 'hidden', border: '1px solid #eee', boxShadow:'0 20px 50px rgba(0,0,0,0.05)' }}>
                  <ShopMap
                    selectedShopIds={selectedShopIds}
                    onToggleShop={handleToggleShop}
                    deliveryTarget={deliveryTarget}
                    activeCategory={selectedSurprise?.category || 'flowers'}
                    allUsers={allUsers}
                  />

                  {selectedSurprise && (
                    <div className="map-broadcast-overlay" style={{ position: 'absolute', bottom: '22px', left: '22px', right: '22px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '1.3rem 1.8rem', borderRadius: '22px', zIndex: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 12px 38px rgba(0,0,0,0.12)', border: '1px solid #eee' }}>
                      <div className="order-recipient">
                        <strong>{selectedShopIds.length} partners selected</strong>
                        <span>Broadcasting to local network...</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-logout" onClick={() => { setSelectedSurprise(null); setViewMode('list'); }}>Cancel</button>
                        <button className="btn-accept" onClick={() => setShowConfirm(true)} disabled={!selectedShopIds.length}>
                          Broadcast Tasks 🚀
                        </button>
                      </div>
                    </div>
                  )}

                  {showConfirm && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="order-card-premium" style={{ width: '380px', padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', fontFamily:'Cormorant Garamond' }}>Confirm Broadcast?</h3>
                        <div style={{ marginBottom: '1.8rem', display:'grid', gap:'0.5rem' }}>
                          {selectedShopIds.map(id => {
                            const s = DUMMY_SHOPS.find(d => d.id.toString() === id.toString()) || 
                                     allUsers.find(u => u._id.toString() === id.toString());
                            const name = s?.name || s?.shopProfile?.businessName || id;
                            const emoji = s?.emoji || (s?.shopProfile?.businessType === 'flowers' ? '🌸' : s?.shopProfile?.businessType === 'chocolate' ? '🍫' : '🎂') || '🏪';
                            return (
                              <div key={id} className="detail-pill" style={{ padding: '0.8rem', fontSize:'0.9rem' }}>
                                {emoji} {name}
                              </div>
                            );
                          })}
                        </div>
                        <button className="btn-accept" onClick={executeBroadcast} style={{ width: '100%', marginBottom: '1rem' }}>
                          Confirm & Send 🚀
                        </button>
                        <button className="btn-logout" style={{ width: '100%', border:'none' }} onClick={() => setShowConfirm(false)}>
                          Go Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'fulfillment' && (
            <>
              <header className="shop-header-intro">
                <h1>Fulfillment Audit</h1>
                <p>Complete record of memorial deliveries and partner performance.</p>
              </header>
              <div className="empty-box" style={{ marginTop: '2rem' }}>
                 <span className="empty-icon">📂</span>
                 <p>Historical logs are being archived.</p>
              </div>
            </>
          )}
          {activeTab === 'settings'    && (
            <>
              <header className="shop-header-intro">
                <h1>Platform Settings</h1>
                <p>Configure regional matching logic and system parameters.</p>
              </header>
              <div className="empty-box" style={{ marginTop: '2rem' }}>
                 <span className="empty-icon">⚙️</span>
                 <p>Configuration panel is locked.</p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
