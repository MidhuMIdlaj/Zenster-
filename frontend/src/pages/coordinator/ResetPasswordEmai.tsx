import { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, Lock, Key } from 'lucide-react';
import { ResetPasswordEmailApi, VerifyOtpApi, ResetPasswordApi } from '../../api/employee/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTime, setResendTime] = useState(30);
  const [otpVerified, setOtpVerified] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!canResend && resendTime > 0) {
      timer = setTimeout(() => {
        setResendTime(resendTime - 1);
      }, 1000);
    } else if (resendTime === 0) {
      setCanResend(true);
    }

    return () => clearTimeout(timer);
  }, [resendTime, canResend]);


  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await ResetPasswordEmailApi(email);
      if (response.status === 200) {
        toast.success('OTP sent to your email!');
        setStep(2);
        setCanResend(false);
        setResendTime(30);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('OTP sending error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await ResetPasswordEmailApi(email);
      
      if (response.status === 200) {
        toast.success('New OTP sent to your email!');
        setCanResend(false);
        setResendTime(30);
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await VerifyOtpApi(email, otp);
      if (response.status === 200) {
        setOtpVerified(true);
        setStep(3);
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
      console.error('OTP verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!password || !confirmPassword) {
    setError('Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (!passwordRegex.test(password)) {
    setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await ResetPasswordApi(email, password);
    if (response.status === 200) {
      toast.success('Password reset successfully!');
      navigate("/employee-login");
    } else {
      setError(response.data.message || 'Password reset failed');
    }
  } catch (err: any) {
    setError(err.response?.data?.message || 'Password reset failed');
    console.error('Password reset error:', err);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-blue-800">Zenter</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">

          {/* Header with wave animation */}
          <div className="bg-indigo-600 p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transform translate-y-full animate-wave"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    height: '20%',
                    top: `${i * 20}%`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-1">
                {step === 1 ? 'Reset Password' : step === 2 ? 'Verify OTP' : 'New Password'}
              </h2>
              <p className="text-indigo-100">
                {step === 1 ? 'Enter your email to receive a reset link' :
                  step === 2 ? 'Enter the OTP sent to your email' :
                    'Create a new password for your account'}
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full py-3 pl-10 pr-4 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Send OTP <ArrowRight size={18} className="ml-2 animate-pulse-slow" />
                    </div>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="relative">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Key size={18} />
                    </span>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className={`w-full py-3 pl-10 pr-4 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                      placeholder="123456"
                      disabled={isSubmitting || otpVerified}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    We sent a 6-digit code to {email}
                  </p>
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                </div>

                {/* Resend OTP Section */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {!canResend ? (
                      `You can request a new code in ${resendTime}s`
                    ) : (
                      "Didn't receive the code?"
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isSubmitting}
                    className={`text-sm font-medium ${canResend ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-400'
                      } transition-colors`}
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpVerified}
                  className={`w-full ${otpVerified ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white py-3 rounded-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200`}
                >
                  {otpVerified ? (
                    <div className="flex items-center">
                      <CheckCircle className="mr-2" /> Verified!
                    </div>
                  ) : isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Verify OTP <ArrowRight size={18} className="ml-2 animate-pulse-slow" />
                    </div>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                  >
                    Use a different email?
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Lock size={18} />
                      </span>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full py-3 pl-10 pr-4 border ${error.includes('Password') ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                        placeholder="At least 8 characters"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Lock size={18} />
                      </span>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full py-3 pl-10 pr-4 border ${error.includes('Password') ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                        placeholder="Confirm your password"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Reset Password <ArrowRight size={18} className="ml-2 animate-pulse-slow" />
                    </div>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/employee-login")}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
            >
              Remember your password? Sign in
            </button>
          </div>
        </div>
      </div>

      {/* Add global styles for animations */}
      <style >{`
        @keyframes wave {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes success {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-wave {
          animation: wave 3s infinite ease-in-out;
        }
        
        .animate-success {
          animation: success 1s ease-in-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}