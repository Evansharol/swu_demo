import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// ── Always-visible demo requests (shown alongside real broadcasts) ──
const DEMO_REQUESTS = [
  {
    _id: 'demo_001',
    recipientName: 'Priya Sharma',
    giftType: 'Red Rose Bouquet',
    deliveryAddress: '42, Rose Garden Street, Saibaba Colony, Coimbatore - 641011',
    scheduledDate: new Date(Date.now() + 86400000).toISOString(),
    category: 'flowers',
    isDemo: true,
  },
  {
    _id: 'demo_002',
    recipientName: 'Anil Kumar',
    giftType: 'Peace Lily Arrangement',
    deliveryAddress: '12, Lotus Nagar, RS Puram, Coimbatore - 641002',
    scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    category: 'flowers',
    isDemo: true,
  },
  {
    _id: 'demo_003',
    recipientName: 'Meera Rajesh',
    giftType: 'Birthday Sunflower Basket',
    deliveryAddress: '7, Sunshine Avenue, Peelamedu, Coimbatore - 641004',
    scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    category: 'flowers',
    isDemo: true,
  },
];

export default function ShopDashboard({ onLogout }) {
  const { currentUser, logout } = useAuth();
  const [incomingOrders, setIncomingOrders] = useState(DEMO_REQUESTS);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fulfillment');
  const [toast, setToast] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const [products, setProducts] = useState([
    { id: 1, name: 'Sun-Kissed Lilies', price: 32, icon: '🌸', status: 'In Stock', orders: 12 },
    { id: 2, name: 'Eternal Red Roses', price: 45, icon: '🌹', status: 'In Stock', orders: 28 },
    { id: 3, name: 'Velvet White Tulips', price: 38, icon: '🌷', status: 'In Stock', orders: 9 },
    { id: 4, name: 'Golden Sunflowers', price: 28, icon: '🌻', status: 'In Stock', orders: 17 },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdEmoji, setNewProdEmoji] = useState('🎁');

  const handleAddProduct = () => {
    if (!newProdName || !newProdPrice) { showToast('Please fill all fields'); return; }
    setProducts(prev => [...prev, {
      id: Date.now(),
      name: newProdName,
      price: parseFloat(newProdPrice),
      icon: newProdEmoji,
      status: 'In Stock',
      orders: 0,
    }]);
    setNewProdName(''); setNewProdPrice(''); setNewProdEmoji('🎁');
    setShowAddModal(false);
    showToast('✅ Product added successfully!');
  };

  const API_URL = '/api';

  const fetchShopData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const bRes = await fetch(`${API_URL}/shops/my-broadcasting`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bData = await bRes.json();
      if (bData.success && bData.data.length > 0) {
        const realIds = bData.data.map(o => o._id);
        const filteredDemos = DEMO_REQUESTS.filter(d => !realIds.includes(d._id));
        setIncomingOrders([...bData.data, ...filteredDemos]);
      } else {
        setIncomingOrders(DEMO_REQUESTS);
      }
      const aRes = await fetch(`${API_URL}/surprises`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const aData = await aRes.json();
      if (aData.success) {
        setActiveOrders(aData.data.filter(o =>
          o.assignedShop === currentUser?.id ||
          o.assignedShop === currentUser?._id ||
          (typeof o.assignedShop === 'object' && o.assignedShop?._id === currentUser?.id)
        ));
      }
    } catch (err) {
      console.error('Shop data error — showing demo data', err);
      setIncomingOrders(DEMO_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchShopData();
    const interval = setInterval(fetchShopData, 10000);
    return () => clearInterval(interval);
  }, [fetchShopData]);

  const handleAcceptOrder = async (orderId) => {
    if (String(orderId).startsWith('demo_')) {
      const order = incomingOrders.find(o => o._id === orderId);
      if (order) {
        setIncomingOrders(prev => prev.filter(o => o._id !== orderId));
        setActiveOrders(prev => [...prev, { ...order, status: 'ordered', isDemo: true }]);
        showToast('✅ Order Accepted! Prepare for delivery.');
      }
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/shops/accept/${orderId}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { showToast('✅ Order Accepted!'); fetchShopData(); }
      else showToast(data.message || 'Failed to accept.');
    } catch { showToast('Server error. Try again.'); }
  };

  const handleDeclineOrder = async (orderId) => {
    if (String(orderId).startsWith('demo_')) {
      setIncomingOrders(prev => prev.filter(o => o._id !== orderId));
      showToast('Request Declined.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/shops/decline/${orderId}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { showToast('Request Declined.'); fetchShopData(); }
    } catch { showToast('Error declining order.'); }
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    showToast(`Status updated to ${newStatus}`);
  };

  const storeName = currentUser?.shopProfile?.businessName || currentUser?.name || 'Floral Aura';
  const storeType = currentUser?.shopProfile?.businessType || 'Flowers & Gifts';

  if (loading) return <div className="loading-screen">Linking to local shop network...</div>;

  const navTo = (tab) => { setActiveTab(tab); setMobileNavOpen(false); };

  return (
    <div className="sdb-wrapper">
      {toast && <div className="sdb-toast">{toast}</div>}

      {/* ── ADD PRODUCT MODAL ── */}
      {showAddModal && (
        <div className="sdb-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="sdb-modal" onClick={e => e.stopPropagation()}>
            <div className="sdb-modal-header">
              <h3>✨ Add New Product</h3>
              <button className="sdb-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="sdb-modal-body">
              <div className="sdb-form-group">
                <label>Choose an Icon</label>
                <div className="sdb-emoji-row">
                  {['🌹','🌸','🌷','🌻','🌼','💐','🍫','🎁','🕯️','🧧'].map(e => (
                    <button
                      key={e} type="button"
                      className={`sdb-emoji-btn${newProdEmoji === e ? ' active' : ''}`}
                      onClick={() => setNewProdEmoji(e)}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div className="sdb-form-group">
                <label>Product Name</label>
                <input className="sdb-input" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="e.g. Midnight Orchid Bouquet" />
              </div>
              <div className="sdb-form-group">
                <label>Price (₹)</label>
                <input className="sdb-input" type="number" min="1" step="1" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="e.g. 2800" />
              </div>
            </div>
            <div className="sdb-modal-footer">
              <button className="sdb-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="sdb-btn-primary" onClick={handleAddProduct}>Create Listing</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP NAVBAR ── */}
      <header className="sdb-navbar">
        <div className="sdb-navbar-left">
          <button className={`sdb-hamburger${mobileNavOpen ? ' open' : ''}`} onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            <span /><span /><span />
          </button>
          <div className="sdb-brand">
            <span className="sdb-brand-leaf">🌿</span>
            <span className="sdb-brand-text">Still <em>With You</em></span>
          </div>
          <span className="sdb-partner-chip">Shop Partner</span>
        </div>
        <div className="sdb-navbar-right">
          <div className="sdb-store-pill" onClick={() => navTo('profile')} title="View shop profile">
            <span className="sdb-live-dot" />
            <span>{storeName}</span>
          </div>
          <button className="sdb-logout-btn" onClick={onLogout || logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="sdb-layout">
        {/* ── SIDEBAR ── */}
        {mobileNavOpen && <div className="sdb-mobile-backdrop" onClick={() => setMobileNavOpen(false)} />}
        <aside className={`sdb-sidebar${mobileNavOpen ? ' open' : ''}`}>
          {/* Store card */}
          <div className="sdb-store-card">
            <div className="sdb-store-avatar">🏪</div>
            <div className="sdb-store-info">
              <strong>{storeName}</strong>
              <span>{storeType}</span>
            </div>
          </div>

          <nav className="sdb-nav">
            <p className="sdb-nav-section">Navigation</p>

            <button className={`sdb-nav-btn${activeTab === 'fulfillment' ? ' active' : ''}`} onClick={() => navTo('fulfillment')}>
              <svg className="sdb-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Fulfillment</span>
              {incomingOrders.length > 0 && <span className="sdb-badge hot">{incomingOrders.length}</span>}
            </button>

            <button className={`sdb-nav-btn${activeTab === 'products' ? ' active' : ''}`} onClick={() => navTo('products')}>
              <svg className="sdb-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Products</span>
              <span className="sdb-badge muted">{products.length}</span>
            </button>

            <button className={`sdb-nav-btn${activeTab === 'profile' ? ' active' : ''}`} onClick={() => navTo('profile')}>
              <svg className="sdb-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Shop Profile</span>
            </button>
          </nav>

          <div className="sdb-verified-chip">
            <span>🛡️</span>
            <div>
              <strong>Verified Partner</strong>
              <small>Saibaba Colony, CBE</small>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="sdb-main">

          {/* ═══ FULFILLMENT TAB ═══ */}
          {activeTab === 'fulfillment' && (
            <div className="sdb-section">
              <div className="sdb-page-head">
                <div>
                  <h1 className="sdb-page-title">Order Fulfillment</h1>
                  <p className="sdb-page-sub">Review incoming tribute requests and manage active deliveries.</p>
                </div>
                <button className="sdb-btn-outline" onClick={fetchShopData}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Stats */}
              <div className="sdb-stats">
                <div className="sdb-stat">
                  <div className="sdb-stat-icon amber">🔥</div>
                  <div><div className="sdb-stat-val">{incomingOrders.length}</div><div className="sdb-stat-lbl">Pending</div></div>
                </div>
                <div className="sdb-stat">
                  <div className="sdb-stat-icon blue">🚚</div>
                  <div><div className="sdb-stat-val">{activeOrders.length}</div><div className="sdb-stat-lbl">In Transit</div></div>
                </div>
                <div className="sdb-stat">
                  <div className="sdb-stat-icon green">📦</div>
                  <div><div className="sdb-stat-val">{products.length}</div><div className="sdb-stat-lbl">Products</div></div>
                </div>
                <div className="sdb-stat">
                  <div className="sdb-stat-icon gold">⭐</div>
                  <div><div className="sdb-stat-val">100%</div><div className="sdb-stat-lbl">On-Time</div></div>
                </div>
              </div>

              {/* Two-column fulfillment workspace */}
              <div className="sdb-fulfillment-grid">
                {/* Incoming */}
                <section className="sdb-fulfillment-col">
                  <div className="sdb-col-title-row">
                    <div className="sdb-col-title">
                      <span className="sdb-col-dot incoming" />
                      <h2>Incoming Requests</h2>
                      <span className="sdb-count-chip">{incomingOrders.length}</span>
                    </div>
                    <p className="sdb-col-hint">Nearby memorial deliveries awaiting confirmation</p>
                  </div>

                  <div className="sdb-orders-list">
                    {incomingOrders.length === 0 ? (
                      <div className="sdb-empty">
                        <span className="sdb-empty-icon">🔔</span>
                        <h4>All caught up!</h4>
                        <p>No pending requests. We'll alert you when a tribute order is near your store.</p>
                      </div>
                    ) : incomingOrders.map(order => (
                      <div key={order._id} className="sdb-order-card">
                        <div className="sdb-order-top">
                          <span className="sdb-order-id">#{String(order._id).slice(-6).toUpperCase()}</span>
                          <span className="sdb-location-pill">📍 Saibaba Colony</span>
                        </div>
                        <div className="sdb-order-content">
                          <div className="sdb-recipient-name">{order.recipientName}</div>
                          <div className="sdb-gift-row">
                            <span>🌸</span><span>{order.giftType}</span>
                          </div>
                          <div className="sdb-addr-row">
                            <span>🏠</span><span>{order.deliveryAddress}</span>
                          </div>
                        </div>
                        <div className="sdb-order-tags">
                          <span className="sdb-tag green">🚀 Fast Dispatch</span>
                          <span className="sdb-tag gold">🎁 Legacy Gift</span>
                          {order.scheduledDate && (
                            <span className="sdb-tag gray">📅 {new Date(order.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          )}
                        </div>
                        <div className="sdb-order-actions">
                          <button className="sdb-btn-decline" onClick={() => handleDeclineOrder(order._id)}>Decline</button>
                          <button className="sdb-btn-accept" onClick={() => handleAcceptOrder(order._id)}>✓ Accept Order</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Active Deliveries */}
                <section className="sdb-fulfillment-col">
                  <div className="sdb-col-title-row">
                    <div className="sdb-col-title">
                      <span className="sdb-col-dot active-del" />
                      <h2>Active Deliveries</h2>
                      <span className="sdb-count-chip">{activeOrders.length}</span>
                    </div>
                    <p className="sdb-col-hint">Tasks in preparation or transit</p>
                  </div>

                  <div className="sdb-orders-list">
                    {activeOrders.length === 0 ? (
                      <div className="sdb-empty">
                        <span className="sdb-empty-icon">🌱</span>
                        <h4>No active tasks</h4>
                        <p>Accept an incoming request to begin preparing a delivery.</p>
                      </div>
                    ) : activeOrders.map(order => (
                      <div key={order._id} className="sdb-order-card active">
                        <div className="sdb-order-top">
                          <span className="sdb-order-id">#{String(order._id).slice(-6).toUpperCase()}</span>
                          <span className={`sdb-status-pill ${order.status || 'ordered'}`}>
                            {order.status === 'delivered' ? '✅ Delivered' : order.status === 'shipped' ? '🚚 In Transit' : '📦 Preparing'}
                          </span>
                        </div>
                        <div className="sdb-order-content">
                          <div className="sdb-recipient-name">{order.recipientName}</div>
                          <div className="sdb-delivery-date">
                            <span>Target:</span>
                            <strong>{order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}</strong>
                          </div>
                          <div className="sdb-addr-row">
                            <span>📍</span><span>{order.deliveryAddress}</span>
                          </div>
                        </div>
                        <div className="sdb-status-update-block">
                          <label className="sdb-update-label">Update Status</label>
                          <select className="sdb-select" value={order.status || 'ordered'} onChange={e => handleUpdateStatus(order._id, e.target.value)}>
                            <option value="ordered">📦 Preparing Arrangement</option>
                            <option value="shipped">🚚 Out for Delivery</option>
                            <option value="delivered">✅ Delivered & Confirmed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ═══ PRODUCTS TAB ═══ */}
          {activeTab === 'products' && (
            <div className="sdb-section">
              <div className="sdb-page-head">
                <div>
                  <h1 className="sdb-page-title">Product Catalog</h1>
                  <p className="sdb-page-sub">Curate thoughtful items that help families remember loved ones.</p>
                </div>
                <button className="sdb-btn-primary" onClick={() => setShowAddModal(true)}>+ Add Product</button>
              </div>

              <div className="sdb-products-grid">
                {products.map(p => (
                  <div key={p.id} className="sdb-product-card">
                    <div className="sdb-product-top">
                      <div className="sdb-product-emoji">{p.icon}</div>
                      <span className={`sdb-stock-chip ${p.status === 'In Stock' ? 'in' : 'out'}`}>
                        <span className="sdb-stock-dot" />{p.status}
                      </span>
                    </div>
                    <h3 className="sdb-product-name">{p.name}</h3>
                    <div className="sdb-product-footer">
                      <span className="sdb-product-price">₹{p.price.toFixed(0)}</span>
                      <span className="sdb-product-orders">{p.orders} orders</span>
                    </div>
                    <button className="sdb-product-edit" onClick={() => showToast('Listing saved.')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit Listing
                    </button>
                  </div>
                ))}

                {/* CTA card */}
                <div className="sdb-product-add-cta" onClick={() => setShowAddModal(true)}>
                  <div className="sdb-add-plus">+</div>
                  <p>Add New Product</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === 'profile' && (
            <div className="sdb-section">
              <div className="sdb-page-head">
                <div>
                  <h1 className="sdb-page-title">Shop Profile</h1>
                  <p className="sdb-page-sub">Manage your local business presence and service details.</p>
                </div>
              </div>

              <div className="sdb-profile-layout">
                <div className="sdb-profile-card">
                  <div className="sdb-profile-hero">
                    <div className="sdb-profile-avatar">🏪</div>
                    <div>
                      <h2 className="sdb-profile-name">{storeName}</h2>
                      <span className="sdb-profile-type-chip">🌸 {storeType}</span>
                    </div>
                    <span className="sdb-official-ribbon">🛡️ Official Partner</span>
                  </div>

                  <div className="sdb-profile-fields">
                    <div className="sdb-pf">
                      <label>Business Name</label>
                      <div className="sdb-pf-value">{storeName}</div>
                    </div>
                    <div className="sdb-pf">
                      <label>Category</label>
                      <div className="sdb-pf-value">{storeType}</div>
                    </div>
                    <div className="sdb-pf full">
                      <label>Store Address</label>
                      <div className="sdb-pf-value">{currentUser?.shopProfile?.address || '123 Floral Garden, Saibaba Colony, Coimbatore - 641011'}</div>
                    </div>
                    <div className="sdb-pf">
                      <label>Contact Email</label>
                      <div className="sdb-pf-value">{currentUser?.email || 'shop@stillwithyou.com'}</div>
                    </div>
                    <div className="sdb-pf">
                      <label>Partner Status</label>
                      <div className="sdb-pf-value"><span className="sdb-active-status">● Active & Receiving</span></div>
                    </div>
                  </div>

                  <button className="sdb-btn-primary" onClick={() => showToast('✅ Profile is up to date.')}>
                    Save Profile Changes
                  </button>
                </div>

                {/* Stats sidebar */}
                <div className="sdb-profile-stats">
                  <div className="sdb-ps-card">
                    <div className="sdb-ps-icon">📦</div>
                    <div className="sdb-ps-val">{incomingOrders.length + activeOrders.length}</div>
                    <div className="sdb-ps-lbl">Total Orders</div>
                  </div>
                  <div className="sdb-ps-card">
                    <div className="sdb-ps-icon">🌸</div>
                    <div className="sdb-ps-val">{products.length}</div>
                    <div className="sdb-ps-lbl">Products Listed</div>
                  </div>
                  <div className="sdb-ps-card">
                    <div className="sdb-ps-icon">⭐</div>
                    <div className="sdb-ps-val">5.0</div>
                    <div className="sdb-ps-lbl">Average Rating</div>
                  </div>
                  <div className="sdb-ps-card">
                    <div className="sdb-ps-icon">🏆</div>
                    <div className="sdb-ps-val">Gold</div>
                    <div className="sdb-ps-lbl">Partner Tier</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
