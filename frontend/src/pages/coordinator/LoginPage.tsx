import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { User, Lock, AlertCircle, ArrowRight, Sun, Battery, Zap } from 'lucide-react';
import { EmployeeLoginApi } from '../../api/employee/auth';
import { useNavigate } from 'react-router-dom';
import { setEmployeeAuth } from '../../store/EmployeeAuthSlice';
import { useDispatch } from 'react-redux';


interface LoginFormState {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
}
const EmployeeLogin: React.FC = () => {
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    error: '',
    isLoading: false

  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleReset = () => {
    navigate('/reset-password');
  };
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const { email, password, error, isLoading } = formState;

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { id, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleInputFocus = (fieldId: string): void => {
    setActiveField(fieldId);
  };

  const handleInputBlur = (): void => {
    setActiveField(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!email || !password) {
      setFormState(prevState => ({
        ...prevState,
        error: 'Please enter both email and password'
      }));
    }

    setFormState(prevState => ({
      ...prevState,
      error: '',
      isLoading: true
    }));

    setTimeout(() => {
      (async () => {
        try {
          const response = await EmployeeLoginApi(email, password);
          if (response.status === 200 && response.data?.data) {
            const { token, id, position, employeeName } = response.data.data;
            dispatch(setEmployeeAuth({ token, id, position, employeeName }));

            if (position === "mechanic") {
              navigate('/mechanic/dashboard');
            } else if (position === "coordinator") {
              navigate('/coordinator/dashboard');
            } else {
              console.warn('[EmployeeLogin] unknown employee role, redirecting to login', position);
              navigate('/employee-login');
            }
          } else {
            setFormState(prevState => ({
              ...prevState,
              isLoading: false,
              error: response.data?.message || 'Login failed. Please try again.'
            }));
          }
        } catch (error: any) {
          console.error('Login error:', error);
          setFormState(prevState => ({
            ...prevState,
            isLoading: false,
            error: error?.response?.data?.message || 'An error occurred during login. Please try again.'
          }));
        }
      })();
    }, 1500);

  }
  const getInputClasses = (fieldId: string): string => {
    const baseClasses = "w-full pl-10 pr-3 py-3 rounded-lg border transition-all duration-300";
    const inactiveClasses = "bg-white/10 border-white/20 text-white placeholder-blue-200/60";
    const activeClasses = "bg-white/20 border-blue-400 text-white placeholder-white/80 shadow-lg shadow-blue-500/20";

    return `${baseClasses} ${activeField === fieldId ? activeClasses : inactiveClasses} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent`;
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full bg-gray-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated circles */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-100 h-64 rounded-full bg-red-600 opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500 opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-3/4 left-1/2 w-48 h-48 rounded-full bg-yellow-400 opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>

        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.45),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.35),_transparent_25%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(15,23,42,0.8))] opacity-90"></div>
      </div>

      {/* Floating icons animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/6 opacity-20 animate-float">
          <Sun size={24} className="text-yellow-300" />
        </div>
        <div className="absolute top-2/3 right-1/4 opacity-20 animate-float" style={{ animationDelay: '1s' }}>
          <Battery size={24} className="text-green-300" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 opacity-20 animate-float" style={{ animationDelay: '2s' }}>
          <Zap size={24} className="text-blue-300" />
        </div>
      </div>

      {/* Content container */}
      <div className={`relative z-10 w-full max-w-md px-4 transition-all duration-1000 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo and company name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-10 backdrop-blur-md mb-4 transition-transform hover:scale-110 shadow-lg shadow-blue-500/20">
            <svg className="w-12 h-12 text-yellow-300 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3V4M12 20V21M4 12H3M21 12H20M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 transition-all duration-500 delay-100 hover:text-blue-300">SolarPower Solutions</h1>
          <p className="text-blue-100 text-lg transition-all duration-500 delay-200">Employee Portal</p>
        </div>

        {/* Login card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-blue-500/30 hover:bg-white/10 border border-white/10">
          {/* Card header */}
          <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-blue-900/40 to-cyan-900/40">
            <h2 className="text-2xl font-semibold text-white">Employee Login</h2>
            <p className="text-blue-100 text-sm mt-1">Access your dashboard</p>
          </div>

          {/* Login form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 flex items-center p-4 rounded-lg bg-red-500/20 text-red-100 text-sm border border-red-500/30 animate-shake">
                <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div className={`transition-all duration-300 ${activeField === 'email' ? 'scale-105' : 'scale-100'}`}>
                <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                  Enter your registered Email
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${activeField === 'email' ? 'text-blue-400' : 'text-blue-200'}`}>
                    <User size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@solarpower.com"
                    value={email}
                    onChange={handleInputChange}
                    onFocus={() => handleInputFocus('email')}
                    onBlur={handleInputBlur}
                    className={getInputClasses('email')}
                  />
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ${activeField === 'email' ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>

              {/* Password field */}
              <div className={`transition-all duration-300 ${activeField === 'password' ? 'scale-105' : 'scale-100'}`}>
                <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${activeField === 'password' ? 'text-blue-400' : 'text-blue-200'}`}>
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handleInputChange}
                    onFocus={() => handleInputFocus('password')}
                    onBlur={handleInputBlur}
                    className={getInputClasses('password')}
                  />
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ${activeField === 'password' ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors relative group"
                >
                  Reset your Password
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-300 group-hover:w-full transition-all duration-300"></span>
                </button>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:from-blue-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                <span className="relative z-10 flex items-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div className="px-8 py-5 bg-gradient-to-r from-black/20 to-black/30 text-center">
            <button
              type="button"
              className="text-sm text-blue-300 hover:text-blue-200 transition-all duration-300 relative inline-flex items-center group"
            >
              <span className="ml-1 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-300 group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
        </div>

        {/* Footer text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-blue-200/70">
            © 2025 SolarPower Solutions • Employee Access Only
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/40 to-transparent"></div>
    </div>
  );
};

// Add some global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-shake {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
`;
document.head.appendChild(style);

export default EmployeeLogin;