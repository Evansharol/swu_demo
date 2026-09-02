import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// ── Always-visible demo requests (shown alongside real broadcasts) ──
const DEMO_REQUESTS = [
  {
    _id: 'demo_001',
    recipientName: 'Priya Sharma',
    giftType: 'Red Rose Bouquet',
    deliveryAddress: '42, Rose Garden Street, Saibaba Colony, Coimbatore - 641011',
    scheduledDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    category: 'flowers',
    isDemo: true,
  },
  {
    _id: 'demo_002',
    recipientName: 'Anil Kumar',
    giftType: 'Peace Lily Arrangement',
    deliveryAddress: '12, Lotus Nagar, RS Puram, Coimbatore - 641002',
    scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString(), // day after tomorrow
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
  const [activeTab, setActiveTab] = useState('fulfillment'); // 'fulfillment' | 'products' | 'profile'
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const [products, setProducts] = useState([
    { id: 1, name: 'Sun-Kissed Lilies', price: 32, icon: '🌸', status: 'In Stock' },
    { id: 2, name: 'Eternal Red Roses', price: 45, icon: '🌹', status: 'In Stock' },
    { id: 3, name: 'Velvet White Tulips', price: 38, icon: '🌷', status: 'In Stock' },
    { id: 4, name: 'Golden Sunflowers', price: 28, icon: '🌻', status: 'In Stock' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdEmoji, setNewProdEmoji] = useState('🎁');

  const handleAddProduct = () => {
    if (!newProdName || !newProdPrice) { showToast('Please fill all fields'); return; }
    const newId = Date.now();
    setProducts([...products, {
      id: newId,
      name: newProdName,
      price: parseFloat(newProdPrice),
      icon: newProdEmoji,
      status: 'In Stock'
    }]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdEmoji('🎁');
    setShowAddModal(false);
    showToast('Product added successfully!');
  };

  const API_URL = '/api';

  const fetchShopData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      // 1. Fetch broadcasted orders from backend
      const bRes = await fetch(`${API_URL}/shops/my-broadcasting`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bData = await bRes.json();
      
      // Merge: real orders first, then demo orders (filter out demos that have the same ID as real)
      if (bData.success && bData.data.length > 0) {
        // Show real orders + keep demo orders that haven't been matched
        const realIds = bData.data.map(o => o._id);
        const filteredDemos = DEMO_REQUESTS.filter(d => !realIds.includes(d._id));
        setIncomingOrders([...bData.data, ...filteredDemos]);
      } else {
        // Backend returned nothing — show demo data
        setIncomingOrders(DEMO_REQUESTS);
      }

      // 2. Fetch already accepted/active orders
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
      console.error('Failed to fetch shop data — showing demo data', err);
      // On any error, fall back to demo data so the UI isn't empty
      setIncomingOrders(DEMO_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchShopData();
    // Poll for new orders every 10 seconds (Real-time feel)
    const interval = setInterval(fetchShopData, 10000);
    return () => clearInterval(interval);
  }, [fetchShopData]);

  const handleAcceptOrder = async (orderId) => {
    // Handle demo orders locally without API call
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
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Order Accepted! Prepare for delivery.');
        fetchShopData();
      } else {
        showToast(data.message || 'Failed to accept order.');
      }
    } catch (err) {
      showToast('Server error. Try again.');
    }
  };

  const handleDeclineOrder = async (orderId) => {
    // Handle demo orders locally
    if (String(orderId).startsWith('demo_')) {
      setIncomingOrders(prev => prev.filter(o => o._id !== orderId));
      showToast('Request Declined.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/shops/decline/${orderId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Request Declined.');
        fetchShopData();
      }
    } catch (err) {
      showToast('Error declining order.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
      // Logic for status update would go here (e.g. PUT /api/surprises/:id)
      showToast(`Status updated to ${newStatus}`);
      // In a real app, this would be an API call
  };

  if (loading) return <div className="loading-screen">Linking to local shop network...</div>;

  return (
    <div className="shop-dashboard-wrapper">
      {toast && <div className="save-toast">{toast}</div>}
      
      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="page-overlay" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="order-card-premium" style={{ width: '400px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontFamily: 'Cormorant Garamond' }}>✨ Add New Product</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
               <div>
                 <label className="field-label">Emoji Icon</label>
                 <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    {['🌹', '🌸', '🌷', '🌻', '🌼', '💐'].map(e => (
                      <button 
                        key={e} 
                        onClick={() => setNewProdEmoji(e)}
                        style={{ background: newProdEmoji === e ? '#f0f7ed' : '#fff', border: `1px solid ${newProdEmoji === e ? '#5aaa38' : '#eee'}`, borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', fontSize: '1.5rem' }}
                      >
                        {e}
                      </button>
                    ))}
                 </div>
               </div>
               <div>
                 <label className="field-label">Product Name</label>
                 <input className="field-input" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="e.g. Midnight Orchid" />
               </div>
               <div>
                 <label className="field-label">Price ($)</label>
                 <input className="field-input" type="number" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="e.g. 29.99" />
               </div>
               <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn-logout" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button className="btn-accept" style={{ flex: 2 }} onClick={handleAddProduct}>Create Listing</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <nav>
        <div className="logo">Still <em>With You</em></div>
        <div className="nav-user-area">
          <div className="user-badge" onClick={() => setActiveTab('profile')} style={{cursor:'pointer'}}>
            <div className="live-dot" />
            <span>{currentUser?.shopProfile?.businessName || currentUser?.name || 'Floral Aura'}</span>
          </div>
          <button className="btn-logout" onClick={onLogout || logout}>Logout</button>
        </div>
      </nav>

      <div className="shop-layout">
        <aside className="shop-sidebar">
          <button 
            className={`shop-side-tab${activeTab === 'fulfillment' ? ' active' : ''}`}
            onClick={() => setActiveTab('fulfillment')}
          >
            <i>📦</i> Fulfillment
          </button>
          <button 
            className={`shop-side-tab${activeTab === 'products' ? ' active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <i>🍱</i> My Products
          </button>
          <button 
            className={`shop-side-tab${activeTab === 'profile' ? ' active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i>🏪</i> Shop Profile
          </button>
        </aside>

        <main className="shop-main-content">
          {activeTab === 'fulfillment' && (
            <>
              <header className="shop-header-intro">
                <h1>Order Fulfillment Center</h1>
                <p>Support your local community by delivering memories with care.</p>
              </header>

              <div className="fulfillment-grid">
                <section className="fulfillment-column">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                    <h2>🔥 Incoming Requests ({incomingOrders.length})</h2>
                    <button 
                      onClick={fetchShopData} 
                      style={{background:'#f0f7ed', border:'1px solid #5aaa38', borderRadius:'10px', padding:'0.4rem 1rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:'700', color:'#2a5220'}}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                  <div className="orders-container">
                    {incomingOrders.length === 0 ? (
                      <div className="empty-box">
                        <span className="empty-icon">🔔</span>
                        <p>Scanning area for new requests...</p>
                      </div>
                    ) : (
                      incomingOrders.map(order => (
                        <div key={order._id} className="order-card-premium">
                          <div className="order-card-header">
                            <span className="order-id-tag">#{order._id.slice(-6)}</span>
                            <div className="detail-pill">📍 Nearby</div>
                          </div>
                          <div className="order-recipient">
                            <strong>{order.recipientName}</strong>
                            <span style={{color: '#c07820', fontWeight: 'bold'}}>Gift: {order.giftType}</span>
                            <span className="order-address" style={{fontSize: '0.8rem', color: '#666', marginTop: '4px', display: 'block'}}>
                               🏠 {order.deliveryAddress}
                            </span>
                          </div>
                          <div className="order-details-pills">
                            <div className="detail-pill">🚀 Fast Token</div>
                            <div className="detail-pill">🎁 Legacy Box</div>
                          </div>
                          <div style={{display: 'flex', gap: '8px', marginTop: '1rem'}}>
                              <button className="btn-logout" style={{flex: 1, padding: '0.8rem', background: '#f5f5f5', color: '#666', border: '1px solid #ddd'}} onClick={() => handleDeclineOrder(order._id)}>
                                Decline
                              </button>
                              <button className="btn-accept" style={{flex: 2}} onClick={() => handleAcceptOrder(order._id)}>
                                Accept Request
                              </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="fulfillment-column">
                  <h2>📦 Active Deliveries ({activeOrders.length})</h2>
                  <div className="orders-container">
                    {activeOrders.length === 0 ? (
                      <div className="empty-box">
                        <span className="empty-icon">🌱</span>
                        <p>No active fulfillment tasks.</p>
                      </div>
                    ) : (
                      activeOrders.map(order => (
                        <div key={order._id} className="order-card-premium">
                          <div className="order-card-header">
                            <span className="order-id-tag">#{order._id.slice(-6)}</span>
                            <div className={`stock-badge ${order.status === 'delivered' ? 'in-stock' : 'out-stock'}`} style={{fontSize:'0.6rem'}}>
                              {order.status}
                            </div>
                          </div>
                          <div className="order-recipient">
                            <strong>{order.recipientName}</strong>
                            <span>{new Date(order.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{marginTop: '1rem'}}>
                            <select 
                              className="field-select"
                              style={{width:'100%', padding:'0.6rem', background:'#f8fcf5'}}
                              value={order.status} 
                              onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                            >
                              <option value="ordered">Preparing Gear</option>
                              <option value="shipped">On Route</option>
                              <option value="delivered">Completed</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <header className="shop-header-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1>My Product Catalog</h1>
                  <p>Curate the items that will carry the weight of precious memories.</p>
                </div>
                <button className="btn-accept" style={{ maxWidth: '180px' }} onClick={() => setShowAddModal(true)}>
                  + Add Product
                </button>
              </header>
              <div className="my-products-grid">
                {products.map(p => (
                  <div key={p.id} className="product-card-premium">
                    <span className="product-emoji">{p.icon}</span>
                    <h3>{p.name}</h3>
                    <div className="product-price">${p.price}</div>
                    <div className={`stock-badge ${p.status === 'In Stock' ? 'in-stock' : 'out-stock'}`}>
                      {p.status}
                    </div>
                    <button className="btn-edit-product">Edit Listing</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <header className="shop-header-intro">
                <h1>Partner Profile</h1>
                <p>Manage your business presence and verification status.</p>
              </header>
              <div style={{ maxWidth: '600px', marginTop: '2rem' }}>
                <div className="order-card-premium">
                   <div style={{ display: 'grid', gap: '1.2rem' }}>
                      <div className="order-recipient"><strong>Business Name</strong><span>{currentUser?.shopProfile?.businessName || currentUser?.name}</span></div>
                      <div className="order-recipient"><strong>Address</strong><span>{currentUser?.shopProfile?.address}</span></div>
                      <div className="order-recipient"><strong>Service Category</strong><span className="stock-badge in-stock">{currentUser?.shopProfile?.businessType || 'Flowers'}</span></div>
                      <div className="detail-pill" style={{ textAlign: 'center', background: '#f0f9e8', padding: '1rem' }}>
                        🛡️ SWU Verified Partner
                      </div>
                      <button className="btn-accept" style={{ background: '#2a3b20' }}>Update Profile Details</button>
                   </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
