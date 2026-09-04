import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import FaceVerifyModal from './FaceVerifyModal.jsx';

const REASON_OPTIONS = [
  'Remembering a loved one who passed away',
  'Preserving memories for future generations',
  'Creating a digital memorial for a friend',
  "Keeping a loved one's legacy alive",
  'Planning messages for specific future dates',
  'Other (please specify)',
];

// Generate a random 6-digit OTP
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, signup, saveFaceDescriptor, getFaceDescriptorByEmail, sendEmailOtp, verifyEmailOtp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('user');
  const [pendingName, setPendingName] = useState('');
  const [error, setError] = useState('');

  // Face verification state
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalMode, setFaceModalMode] = useState('login'); // 'login' | 'signup'
  const [pendingLoginUser, setPendingLoginUser] = useState(null); // holds user after creds pass
  const [storedDescriptor, setStoredDescriptor] = useState([]);
  const [signupFaceDescriptor, setSignupFaceDescriptor] = useState(null);

  // Form refs/state
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);

  // -- New signup fields --
  const [userPhone, setUserPhone] = useState('');
  const [userWhatsApp, setUserWhatsApp] = useState('');
  
  // -- Phone OTP --
  const [generatedPhoneOTP, setGeneratedPhoneOTP] = useState('');
  const [enteredPhoneOTP, setEnteredPhoneOTP] = useState('');
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  
  // -- Email OTP --
  const [generatedEmailOTP, setGeneratedEmailOTP] = useState('');
  const [enteredEmailOTP, setEnteredEmailOTP] = useState('');
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verificationMethod, setVerificationMethod] = useState(''); // 'email' | 'phone'
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // -- Identity verification --
  const [identityStep, setIdentityStep] = useState('start'); // 'start' | 'selfie' | 'question' | 'verified'
  const [selfieStatus, setSelfieStatus] = useState('idle'); // 'idle' | 'capturing' | 'analyzing' | 'done'
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [idVerified, setIdVerified] = useState(false);

  // store email/password across steps
  const [savedEmail, setSavedEmail] = useState('');
  const [savedPass, setSavedPass] = useState('');

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // -- LOGIN: Step 1 - Verify credentials --
  const handleLogin = async () => {
    const email = emailRef.current?.value.trim() || '';
    const password = passRef.current?.value || '';
    if (!email || !password) { setError('Please fill in both fields.'); return; }
    setError('');

    // 1. Validate credentials against backend
    const result = await login(email, password, role);
    if (!result.success) { setError(result.message); return; }

    // 2. Fetch the stored face descriptor for this user
    const faceData = await getFaceDescriptorByEmail(email);

    if (faceData.hasFaceData) {
      // Has a stored face — open camera for verification
      setStoredDescriptor(faceData.faceDescriptor);
      setPendingLoginUser(result.user);
      setFaceModalMode('login');
      setShowFaceModal(true);
    } else {
      // No face data stored — go straight in
      onClose();
      if (onLoginSuccess) onLoginSuccess(result.user);
      navigate(
        result.user.role === 'admin' ? '/admin-dashboard' : 
        result.user.role === 'shop' ? '/shop-dashboard' : '/user-dashboard'
      );
    }
  };

  // -- LOGIN: Step 2 - Face verified, complete login --
  const handleFaceVerified = useCallback(() => {
    setShowFaceModal(false);
    const user = pendingLoginUser;
    if (!user) return;
    onClose();
    if (onLoginSuccess) onLoginSuccess(user);
    navigate(
      user.role === 'admin' ? '/admin-dashboard' : 
      user.role === 'shop' ? '/shop-dashboard' : '/user-dashboard'
    );
  }, [pendingLoginUser, onClose, onLoginSuccess, navigate]);

  // -- LOGIN: Face failed --
  const handleFaceFailed = useCallback((msg) => {
    setShowFaceModal(false);
    setError(msg || 'Face verification failed. Please try again.');
  }, []);

  // -- SIGNUP: Step 1 -> go to email verification --
  const handleSignupBasic = async () => {
    const name = nameRef.current?.value.trim();
    const email = emailRef.current?.value.trim();
    const password = passRef.current?.value;
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    // User flow: save data and move to verification choice step
    setError('');
    setPendingName(name);
    setSavedEmail(email);
    setSavedPass(password);
    setMode('signup-verify-choice');
  };

  // -- SIGNUP: Step 2 -> Send Email OTP --
  const handleSendEmailOTP = async () => {
    setError('');
    // Use savedEmail if available, otherwise prompt error
    const emailToVerify = emailRef.current?.value.trim() || savedEmail;
    if (!emailToVerify) {
      setError('Email is required.');
      return;
    }
    
    const res = await sendEmailOtp(emailToVerify, pendingName);
    if (res.success) {
      setEmailOtpSent(true);
      setOtpCountdown(60);
      setEmailOtpVerified(false);
      setEnteredEmailOTP('');
    } else {
      setError(res.message || 'Failed to send OTP email.');
    }
  };

  const handleVerifyEmailOTP = async () => {
    setError('');
    const emailToVerify = emailRef.current?.value.trim() || savedEmail;
    const res = await verifyEmailOtp(emailToVerify, enteredEmailOTP);
    
    if (res.success) {
      setEmailOtpVerified(true);
      setError('');
      setTimeout(() => setMode('signup-reason'), 400);
    } else {
      setError(res.message || 'Invalid Email OTP. Please try again.');
    }
  };

  // -- SIGNUP: Step 3 -> Send Phone OTP --
  const handleSendPhoneOTP = () => {
    if (!userPhone.trim() || userPhone.trim().length < 8) {
      setError('Please enter a valid phone number.'); return;
    }
    setError('');
    const otp = generateOTP();
    setGeneratedPhoneOTP(otp);
    setPhoneOtpSent(true);
    setOtpCountdown(60);
    setPhoneOtpVerified(false);
    setEnteredPhoneOTP('');
    // Real app: trigger SMS API
  };

  const handleVerifyPhoneOTP = () => {
    if (enteredPhoneOTP === generatedPhoneOTP) {
      setPhoneOtpVerified(true);
      setError('');
      setTimeout(() => setMode('signup-reason'), 400);
    } else {
      setError('Invalid Phone OTP. Please try again.');
    }
  };

  const handleResendOTP = () => {
    if (otpCountdown > 0) return;
    if (mode === 'signup-email') handleSendEmailOTP();
    else if (mode === 'signup-phone') handleSendPhoneOTP();
  };

  // -- SIGNUP: Step 4 -> After reason, go to identity --
  const handleReasonNext = () => {
    if (!selectedReason && !customReason.trim()) {
      setError('Please select a reason or describe your purpose.'); return;
    }
    setError('');
    setMode('signup-identity');
    setIdentityStep('start');
  };

  // -- SIGNUP: Step 5a - Face Captured (real camera) --
  const handleFaceCaptured = useCallback(async (descriptor) => {
    setShowFaceModal(false);
    setIdVerified(true);
    setIdentityStep('question');
    setSignupFaceDescriptor(descriptor);
    const questions = [
      'What city were you born in?',
      "What is your mother's maiden name?",
      'What was the name of your first pet?',
      'What is the name of the street you grew up on?',
    ];
    setSecurityQuestion(questions[Math.floor(Math.random() * questions.length)]);
  }, [saveFaceDescriptor]);

  const handleSecurityAnswer = () => {
    if (!securityAnswer.trim()) { setError('Please answer the security question.'); return; }
    setError('');
    setIdVerified(true);
    setIdentityStep('verified');
    setTimeout(() => handleSignupComplete(), 800);
  };

  // -- SIGNUP: Final step -> Complete --
  const handleSignupComplete = async () => {
    const result = await signup({
      name: pendingName,
      email: savedEmail,
      password: savedPass,
      role: 'user',
      phone: userPhone,
      whatsApp: userWhatsApp || userPhone,
      reason: customReason,
      identityVerified: idVerified,
      faceDescriptor: signupFaceDescriptor,
      emailVerified: emailOtpVerified,
      phoneVerified: phoneOtpVerified,
    });
    if (!result.success) { setError(result.message); return; }
    setError('');
    onClose();
    if (onLoginSuccess) onLoginSuccess(result.user);
    navigate('/user-dashboard');
  };

  const handlePassKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
  };

  const resetModal = () => {
    setMode('login');
    setRole('user');
    setError('');
    setVerificationMethod('');
    setPhoneOtpSent(false);
    setPhoneOtpVerified(false);
    setEnteredPhoneOTP('');
    setGeneratedPhoneOTP('');
    setEmailOtpSent(false);
    setEmailOtpVerified(false);
    setEnteredEmailOTP('');
    setGeneratedEmailOTP('');
    setUserPhone('');
    setUserWhatsApp('');
    setSelectedReason('');
    setCustomReason('');
    setIdentityStep('start');
    setSelfieStatus('idle');
    setIdVerified(false);
    setSecurityAnswer('');
  };

  useEffect(() => {
    if (!isOpen) resetModal();
  }, [isOpen]);

  if (!isOpen) return null;

  // Step indicators for user signup
  const userSteps = [
    { id: 'signup', label: 'Basics' },
    { id: 'signup-verify-choice', label: 'Verify' },
    { id: 'signup-reason', label: 'Purpose' },
    { id: 'signup-identity', label: 'Identity' },
  ];
  const currentStepIdx = userSteps.findIndex(s => {
    if (s.id === mode) return true;
    if (mode === 'signup-email' || mode === 'signup-phone') return s.id === 'signup-verify-choice';
    return false;
  });
  const showProgress = role === 'user' && currentStepIdx >= 0;

  return (
    <>
    <div
      className={`overlay${isOpen ? ' show' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal${showProgress ? ' modal-wide' : ''}`}>
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <div className="modal-logo">Still <em>With You</em></div>

        {/* -- PROGRESS INDICATOR -- */}
        {showProgress && (
          <div className="signup-progress">
            {userSteps.map((step, i) => (
              <div key={step.id} className={`sp-step${i === currentStepIdx ? ' active' : ''}${i < currentStepIdx ? ' done' : ''}`}>
                <div className="sp-dot">{i < currentStepIdx ? '✓' : i + 1}</div>
                <span className="sp-label">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* -- ROLE TOGGLE (login/signup only) -- */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="role-toggle">
            <button className={`role-btn${role === 'user' ? ' active' : ''}`} onClick={() => setRole('user')}>
              👤 User
            </button>
            <button className={`role-btn${role === 'shop' ? ' active' : ''}`} onClick={() => setRole('shop')}>
              🏪 Shop
            </button>
            <button className={`role-btn${role === 'admin' ? ' active' : ''}`} onClick={() => setRole('admin')}>
              🛡️ Admin
            </button>
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        {/* === LOGIN === */}
        {mode === 'login' && (
          <>
            <h2>Welcome Back</h2>
            <p className="sub">
              {role === 'user' ? 'Log in to grow your living memorial.' : 'Platform management & monitoring.'}
            </p>
            <input ref={emailRef} type="email" placeholder="Email address" autoComplete="off" />
            <input ref={passRef} type="password" placeholder="Password" onKeyDown={handlePassKeyDown} />
            <button className="btn-go" onClick={handleLogin}>Log In</button>
            {role === 'user' && (
              <>
                <div className="modal-switch">
                  Don't have an account? <a onClick={switchMode}>Sign Up</a>
                </div>
                <div className="demo-hint">Demo: evan@gmail.com / pass123</div>
              </>
            )}
            {role === 'admin' && (
              <div className="demo-hint">Demo: admin@stillwithyou.com / admin123</div>
            )}
            {role === 'shop' && (
              <div className="demo-hint">Demo: shop@stillwithyou.com / shop123</div>
            )}
          </>
        )}

        {/* === SIGNUP: Step 1 - Basic Info === */}
        {mode === 'signup' && (
          <>
            <h2>Join Us</h2>
            <p className="sub">
              {role === 'user'
                ? 'Begin your journey of preserving memories. Choose your method of verification below.'
                : 'Admins cannot register here. Please contact the system administrator.'}
            </p>
            {role === 'user' && (
              <div className="auth-step-1">
                <input ref={nameRef} type="text" placeholder="Your full name" autoComplete="off" />
                <input ref={emailRef} type="email" placeholder="Email address" />
                <input ref={passRef} type="password" placeholder="Password (min 6 characters)" />
                <button className="btn-go" onClick={handleSignupBasic} disabled={role === 'admin'}>Next Step →</button>
                <div className="modal-switch">
                  Already have an account? <a onClick={switchMode}>Log In</a>
                </div>
              </div>
            )}
          </>
        )}

        {/* === SIGNUP: Step 2a - Verification Choice === */}
        {mode === 'signup-verify-choice' && (
          <>
            <h2>🛡️ Choose Verification Method</h2>
            <p className="sub">
              For your account security, please choose one way to verify your identity.
            </p>
            <div className="verification-choice-grid">
              <button
                className="btn-go choice-btn"
                onClick={() => {
                  setVerificationMethod('email');
                  setMode('signup-email');
                }}
              >
                <span className="choice-icon">📧</span>
                <span className="choice-text">Verify via Email</span>
              </button>
              <button
                className="btn-go choice-btn"
                onClick={() => {
                  setVerificationMethod('phone');
                  setMode('signup-phone');
                }}
              >
                <span className="choice-icon">📱</span>
                <span className="choice-text">Verify via Phone</span>
              </button>
            </div>
            <button className="btn-back" onClick={() => setMode('signup')}>
              ← Back to Basics
            </button>
          </>
        )}

        {/* === SIGNUP: Step 2 - Email OTP Verification === */}
        {mode === 'signup-email' && (
          <>
            <h2>📧 Verify Your Email</h2>
            <p className="sub">
              We've sent a verification code to <strong>{savedEmail}</strong> to ensure your account security.
            </p>

            {!emailOtpSent ? (
              <button className="btn-go btn-otp-send" onClick={handleSendEmailOTP}>
                Send Verification Email
              </button>
            ) : (
              <div className="otp-section">
                <div className="otp-sent-badge">
                  <span>✓</span> Verification code sent!
                </div>
                <div className="otp-input-row">
                  <input
                    type="text"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={enteredEmailOTP}
                    onChange={e => setEnteredEmailOTP(e.target.value.replace(/\D/g, ''))}
                    className={`otp-input${emailOtpVerified ? ' verified' : ''}`}
                  />
                </div>
                {!emailOtpVerified && (
                  <>
                    <button className="btn-go" onClick={handleVerifyEmailOTP}>Verify Email</button>
                    <button
                      className={`btn-resend${otpCountdown > 0 ? ' disabled' : ''}`}
                      onClick={handleResendOTP}
                      disabled={otpCountdown > 0}
                    >
                      {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                    </button>
                  </>
                )}
                <div className="demo-hint" style={{ marginTop: '.5rem' }}>
                  🔑 Demo Email OTP: <strong>{generatedEmailOTP}</strong>
                </div>
              </div>
            )}
          </>
        )}

        {/* === SIGNUP: Step 3 - Phone & Phone OTP Verification === */}
        {mode === 'signup-phone' && (
          <>
            <h2>📱 Verify Your Phone</h2>
            <p className="sub">
              Collect phone number for security and emergency delivery notifications.
            </p>

            <div className="auth-field-group">
              <label className="auth-label">Phone Number <span className="auth-required">*</span></label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={userPhone}
                onChange={e => setUserPhone(e.target.value)}
                className={phoneOtpSent ? 'input-locked' : ''}
                readOnly={phoneOtpSent}
              />
            </div>

            <div className="auth-field-group">
              <label className="auth-label">WhatsApp Number <span className="auth-hint">(if different)</span></label>
              <input type="tel" placeholder="Same as phone if left empty" value={userWhatsApp} onChange={e => setUserWhatsApp(e.target.value)} />
            </div>

            {!phoneOtpSent ? (
              <button className="btn-go btn-otp-send" onClick={handleSendPhoneOTP}>
                📩 Send Phone OTP
              </button>
            ) : (
              <div className="otp-section">
                <div className="otp-sent-badge">
                  <span>✓</span> Phone OTP sent!
                </div>
                <div className="otp-input-row">
                  <input
                    type="text"
                    placeholder="Enter Phone OTP"
                    maxLength={6}
                    value={enteredPhoneOTP}
                    onChange={e => setEnteredPhoneOTP(e.target.value.replace(/\D/g, ''))}
                    className={`otp-input${phoneOtpVerified ? ' verified' : ''}`}
                  />
                  {phoneOtpVerified && <span className="otp-verified-badge">✓ Verified</span>}
                </div>
                {!phoneOtpVerified && (
                  <>
                    <button className="btn-go" onClick={handleVerifyPhoneOTP}>Verify Phone</button>
                    <button
                      className={`btn-resend${otpCountdown > 0 ? ' disabled' : ''}`}
                      onClick={handleResendOTP}
                      disabled={otpCountdown > 0}
                    >
                      {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                    </button>
                  </>
                )}
                <div className="demo-hint" style={{ marginTop: '.5rem' }}>
                  🔑 Demo Phone OTP: <strong>{generatedPhoneOTP}</strong>
                </div>
              </div>
            )}
          </>
        )}

        {/* === SIGNUP: Step 4 - Reason & Emergency Contact === */}
        {mode === 'signup-reason' && (
          <>
            <h2>💚 Why are you here?</h2>
            <p className="sub">Please tell us your purpose for creating this memorial. This helps us personalize your experience.</p>

            <div className="purpose-input-section">
              <label className="auth-label">Your Purpose <span className="auth-required">*</span></label>
              <textarea
                className="reason-textarea"
                placeholder="Write your purpose here (e.g., Remembering a loved one, preserving legacy...)"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                rows={5}
              />
            </div>

            <button className="btn-go" onClick={handleReasonNext}>Continue →</button>
          </>
        )}

        {/* === SIGNUP: Step 5 - Identity Verification === */}
        {mode === 'signup-identity' && (
          <>
            <h2>🛡️ Identity Verification</h2>
            <p className="sub">
              We take extra steps to verify every account is a real person. This protects the integrity of memorials.
            </p>

            {identityStep === 'start' && (
              <div className="id-verify-start">
                <div className="id-verify-icon">🔍</div>
                <h3>Why we verify</h3>
                <p>Memorials are sacred. We make sure every account belongs to a real, living person to prevent misuse and ensure dignity.</p>
                <div className="id-verify-methods">
                  <div className="id-method">
                    <span className="id-method-icon">📸</span>
                    <div>
                      <strong>Live Selfie Check</strong>
                      <span>Quick camera capture to prove you're a real person</span>
                    </div>
                  </div>
                  <div className="id-method">
                    <span className="id-method-icon">❓</span>
                    <div>
                      <strong>Security Question</strong>
                      <span>Answer a personal question for account recovery</span>
                    </div>
                  </div>
                </div>
                <button className="btn-go" onClick={() => { setFaceModalMode('signup'); setShowFaceModal(true); }}>
                  📸 Start Verification
                </button>
              </div>
            )}

            {identityStep === 'question' && (
              <div className="security-question-section">
                <div className="sq-badge">✓ Selfie verified</div>
                <h3>Security Question</h3>
                <p className="sq-desc">This will be used for account recovery and as an additional identity check.</p>
                <label className="auth-label">{securityQuestion}</label>
                <input type="text" placeholder="Your answer..." value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} />
                <button className="btn-go" onClick={handleSecurityAnswer}>Continue →</button>
              </div>
            )}

            {identityStep === 'verified' && (
              <div className="id-verified-card">
                <div className="id-verified-icon">🛡️</div>
                <h3>Identity Verified</h3>
                <p>Your account is now verified. We are finalizing your profile...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    <FaceVerifyModal
      isOpen={showFaceModal}
      mode={faceModalMode}
      storedDescriptor={storedDescriptor}
      onCapture={handleFaceCaptured}
      onVerified={handleFaceVerified}
      onFailed={handleFaceFailed}
      onClose={() => setShowFaceModal(false)}
    />
    </>
  );
}
