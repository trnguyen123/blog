import { useState } from 'react';
import { authService } from '../../services/authService';

export default function AuthPage({ onLogin, loginError: initialLoginError }) {
  const [authTab, setAuthTab] = useState('login');
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register form
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialLoginError || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      if (onLogin) {
        onLogin(result);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    // Validation
    if (!name || !registerEmail || !registerPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        name,
        email: registerEmail,
        password: registerPassword,
      });
      
      // Reset form
      setName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setAgreeTerms(false);
      
      if (onLogin) {
        onLogin(result);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="page-header">
          <div>
            <h1>Welcome back to Inkwell</h1>
            <p className="text-muted">Sign in to manage posts, comments and moderation.</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={authTab === 'login' ? 'active' : ''} onClick={() => setAuthTab('login')}>Login</button>
          <button className={authTab === 'register' ? 'active' : ''} onClick={() => setAuthTab('register')}>Register</button>
        </div>

        {authTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                className="input-field" 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <div style={{ position: 'relative' }}>
                <input 
                  className="input-field" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <label className="toggle-pill"><input type="checkbox" disabled={loading} /> Remember me</label>
              <a href="#" className="small-text">Forgot password?</a>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="divider-row"><span>or continue with</span></div>
            <button type="button" className="btn btn-secondary" disabled={loading}>Continue with Google</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <input 
                className="input-field" 
                type="text" 
                placeholder="Full name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
              <input 
                className="input-field" 
                type="email" 
                placeholder="Email address" 
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                disabled={loading}
                required
              />
              <input 
                className="input-field" 
                type="password" 
                placeholder="Password" 
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                disabled={loading}
                required
              />
              <input 
                className="input-field" 
                type="password" 
                placeholder="Confirm password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <label className="toggle-pill">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
              /> 
              I agree to the terms and conditions
            </label>
            {error && <div className="error-message">{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
