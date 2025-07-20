import React, { useState, useEffect } from 'react';
import { useSendOtpMutation, useVerifyOtpMutation } from '../services/reduxApi';
import { useAuth } from '../context/AuthContext';
import '../styles.css';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: verifyingOtp }] = useVerifyOtpMutation();


  useEffect(() => {
    document.body.style.background = '#111';
    return () => { document.body.style.background = ''; };
  }, []);

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    try {
      await sendOtp({ email }).unwrap();
      setInfo('OTP sent to your email.');
      setStep(2);
    } catch (err: any) {
      setError(err.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setInfo('');
    try {
      await verifyOtp({ email, otp }).unwrap();
      login(email);
      navigate('/');
    } catch (err: any) {
      setError(err.data?.error || 'Invalid OTP');
    }
  };

  const loading = sendingOtp || verifyingOtp;

  return (
    <div className="login-fade">
      <div className="login-card">
        <h1 className="login-title">Hayas Admin</h1>
        {error && <div className="login-alert error">{error}</div>}
        {info && <div className="login-alert info">{info}</div>}
        {step === 1 && (
          <>
            <input
              className="login-input"
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            <button
              className="login-btn"
              onClick={handleSendOtp}
              disabled={!email || loading}
            >
              {loading ? <span className="login-spinner">Sending...</span> : 'Send OTP'}
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <input
              className="login-input"
              type="text"
              placeholder="OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              autoFocus
            />
            <button
              className="login-btn"
              onClick={handleVerifyOtp}
              disabled={!otp || loading}
            >
              {loading ? <span className="login-spinner">Verifying...</span> : 'Verify OTP'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 