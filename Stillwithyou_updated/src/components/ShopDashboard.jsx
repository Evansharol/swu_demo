import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ShopDashboard({ onLogout }) {
  const { currentUser, logout } = useAuth();
  const [incomingOrders, setIncomingOrders] = useState([]);
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

  const API_URL = 'http://127.0.0.1:5000/api';

  const fetchShopData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      // 1. Fetch broadcasted orders
      const bRes = await fetch(`${API_URL}/shops/my-broadcasting`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bData = await bRes.json();
      if (bData.success) setIncomingOrders(bData.data);

      // 2. Fetch already accepted/active orders (we'll reuse the surprises endpoint which returns user-specific records)
      const aRes = await fetch(`${API_URL}/surprises`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const aData = await aRes.json();
      if (aData.success) {
        // Filter for orders where assignedShop is this shop
        setActiveOrders(aData.data.filter(o => o.assignedShop === currentUser.id || o.assignedShop === currentUser._id));
      }
    } catch (err) {
      console.error('Failed to fetch shop data', err);
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
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/shops/accept/${orderId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order Accepted! Prepare for delivery.');
        fetchShopData();
      } else {
        showToast(data.message || 'Failed to accept order.');
      }
    } catch (err) {
      showToast('Server error. Try again.');
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
            <span>{currentUser?.shopProfile?.businessName || 'Partner Shop'}</span>
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
                  <h2>🔥 Incoming Requests ({incomingOrders.length})</h2>
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
                            <span>Dilevery for {order.giftType}</span>
                          </div>
                          <div className="order-details-pills">
                            <div className="detail-pill">🚀 Fast Token</div>
                            <div className="detail-pill">🎁 Gift</div>
                          </div>
                          <button className="btn-accept" onClick={() => handleAcceptOrder(order._id)}>
                            Accept Delivery Request
                          </button>
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
                      <div className="order-recipient"><strong>Business Name</strong><span>{currentUser?.shopProfile?.businessName}</span></div>
                      <div className="order-recipient"><strong>Address</strong><span>{currentUser?.shopProfile?.address}</span></div>
                      <div className="order-recipient"><strong>Service Category</strong><span className="stock-badge in-stock">{currentUser?.shopProfile?.category || 'General'}</span></div>
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
