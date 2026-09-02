import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = '/api';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [surprises, setSurprises] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [fulfillmentLogs, setFulfillmentLogs] = useState([]);

  const fetchData = useCallback(async (user, token) => {
    try {
      if (user.role === 'admin') {
        const [uRes, lRes, sAllRes] = await Promise.all([
          fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/users/logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/surprises`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const uData = await uRes.json();
        const lData = await lRes.json();
        const sAllData = await sAllRes.json();
        if (uData.success) setAllUsers(uData.data);
        if (lData.success) setFulfillmentLogs(lData.data);
        if (sAllData.success) setSurprises(sAllData.data);
      } else {
        const [mRes, sRes] = await Promise.all([
          fetch(`${API_URL}/memories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/surprises`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const mData = await mRes.json();
        const sData = await sRes.json();
        if (mData.success) setMemories(mData.data);
        if (sData.success) setSurprises(sData.data);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  }, []);

  // ─── SERVER RESTART SYNC ───
  useEffect(() => {
    const checkServerSync = async () => {
      try {
        const res = await fetch(`${API_URL}/test`);
        const data = await res.json();
        const lastId = localStorage.getItem('last_server_instance_id');
        
        if (lastId && data.instanceId && lastId !== data.instanceId) {
          console.log('🔄 Server restart detected. Resetting app to initial state...');
          localStorage.clear();
          window.location.reload();
          return;
        }
        
        if (data.instanceId) {
          localStorage.setItem('last_server_instance_id', data.instanceId);
        }
      } catch (err) {
        // Backend might be down, ignore
      }
    };
    checkServerSync();
  }, []);

  // ─── INITIAL LOAD ───
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.data);
          await fetchData(data.data, token);
        } else {
          localStorage.removeItem('token');
          // If token is invalid, also clear the instanceId to prevent loops
          localStorage.removeItem('last_server_instance_id');
          window.location.reload();
        }
      } catch (err) {
        console.error('Failed to load user', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [fetchData]);

  // ─── LOGIN ───
  const login = useCallback(async (email, password, role) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!data.success) return { success: false, message: data.message };

      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      await fetchData(data.user, data.token);

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }, [fetchData]);

  // ─── SIGNUP ───
  const signup = useCallback(async (data) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!result.success) return { success: false, message: result.message };

      localStorage.setItem('token', result.token);
      setCurrentUser(result.user);
      await fetchData(result.user, result.token);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setMemories([]);
    setSurprises([]);
    setAllUsers([]);
    setFulfillmentLogs([]);
  }, []);

  // ─── SAVE FACE DESCRIPTOR (called after signup selfie) ───
  const saveFaceDescriptor = useCallback(async (descriptor) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch(`${API_URL}/auth/save-face`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ faceDescriptor: descriptor })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: 'Server error saving face data.' };
    }
  }, []);

  // ─── SEND EMAIL OTP ───
  const sendEmailOtp = useCallback(async (email, name) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: `Server error: ${res.status}` }));
        return { success: false, message: errData.message };
      }
      return await res.json();
    } catch (err) {
      console.error('OTP Fetch Error:', err);
      return { success: false, message: 'Could not connect to the backend server.' };
    }
  }, []);

  // ─── VERIFY EMAIL OTP ───
  const verifyEmailOtp = useCallback(async (email, otp) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: `Verification error: ${res.status}` }));
        return { success: false, message: errData.message };
      }
      return await res.json();
    } catch (err) {
      console.error('Verify OTP Error:', err);
      return { success: false, message: 'Could not connect to the backend server.' };
    }
  }, []);

  // ─── GET STORED FACE DESCRIPTOR BY EMAIL (called before login camera) ───
  const getFaceDescriptorByEmail = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/face-descriptor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, hasFaceData: false, faceDescriptor: [] };
    }
  }, []);

  // ─── ADD NEW MEMORY ───
  const addMemory = useCallback(async (memoryData) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch(`${API_URL}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(memoryData)
      });
      const data = await res.json();
      if (data.success) {
        setMemories(prev => [data.data, ...prev]);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server error saving memory.' };
    }
  }, []);

  // ─── ADD NEW SURPRISE (Gift) ───
  const addSurprise = useCallback(async (surpriseData) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch(`${API_URL}/surprises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(surpriseData)
      });
      const data = await res.json();
      if (data.success) {
        setSurprises(prev => [data.data, ...prev]);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server error saving surprise.' };
    }
  }, []);

  // ─── UPDATE PROFILE ───
  const updateProfile = useCallback(async (profileData) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server error updating profile.' };
    }
  }, []);

  const value = useMemo(() => ({
    currentUser,
    loading,
    login,
    signup,
    logout,
    saveFaceDescriptor,
    getFaceDescriptorByEmail,
    sendEmailOtp,
    verifyEmailOtp,
    addMemory,
    addSurprise,
    updateProfile,
    // Provide state directly so components don't need to call async functions
    allUsers,
    fulfillmentLogs,
    memories,
    surprises,
    // Add these for backward compatibility with components using functions
    getAllUsers: () => allUsers,
    getFulfillmentLogs: () => fulfillmentLogs,
    getUserMemories: () => memories,
    getUserSurprises: () => surprises,
    getUserOrders: () => [], // Placeholder for now
  }), [currentUser, loading, login, signup, logout, saveFaceDescriptor, getFaceDescriptorByEmail, sendEmailOtp, verifyEmailOtp, addMemory, addSurprise, allUsers, fulfillmentLogs, memories, surprises]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
