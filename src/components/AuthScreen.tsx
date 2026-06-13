import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleSignIn } from '../utils/firebase';
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, AlertCircle, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceLogo } from './WorkspaceLogo';
import PlasmaWave from './PlasmaWave';

interface AuthScreenProps {
  onAuthSuccess: (email: string, token: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasEmailError = !!(
    errorCode === 'auth/invalid-email' || 
    errorCode === 'auth/user-not-found' || 
    errorCode === 'auth/email-already-in-use' ||
    errorCode === 'reset/missing-email' ||
    (errorMsg && errorMsg.toLowerCase().includes('email'))
  );

  const hasPasswordError = !!(
    errorCode === 'auth/wrong-password' || 
    errorCode === 'auth/weak-password' || 
    errorCode === 'auth/invalid-credential' ||
    (errorMsg && (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('passphrase')))
  );

  const hasNameError = !!(
    isRegister && !name && errorMsg && errorMsg.toLowerCase().includes('name')
  );

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setErrorCode(null);

    if (!email) {
      setErrorMsg('Please specify your registered email address first so we can dispatch a password reset link.');
      setErrorCode('reset/missing-email');
      return;
    }

    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`A secure vault recovery link has been dispatched to ${email}. Please verify your inbox and spam folder.`);
    } catch (err: any) {
      console.error('Password reset dispatch error:', err);
      setErrorCode(err.code || 'reset/failure');
      if (err.code === 'auth/invalid-email') {
        setErrorMsg('The submitted email address format is invalid.');
      } else if (err.code === 'auth/user-not-found') {
        setErrorMsg('No vault record matches this email address. Please register or verify the spelling.');
      } else {
        setErrorMsg(`Failed to dispatch recovery link: ${err.message}`);
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setErrorCode(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    if (isRegister && !name) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      // Set persistence beforehand based on choice
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      if (isRegister) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name in profile
        await updateProfile(userCredential.user, {
          displayName: name
        });
        setSuccessMsg('Account created successfully! Connecting your workspace session...');
        // The onAuthStateChanged listner in App.tsx will pick up this new auth session
      } else {
        // Sign in user
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Access approved! Welcome back.');
      }
    } catch (err: any) {
      console.error('Firebase Auth Form Error:', err);
      setErrorCode(err.code || 'auth/form-error');
      let localizedError = err.message;
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'This email address is already registered. Standard Sign-In mode is now automatically active — please type your passphrase below to login or enter your secure vault!';
        setIsRegister(false); // Automatically switch tabs to Sign In mode for seamless UX!
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'The email address format is invalid. Please try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        localizedError = 'Email/Password accounts are currently disabled in this app\'s Firebase console. Please use Sign in with Google or enable Email/Password provider.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'Password is too weak. Please use a stronger password.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = 'Incorrect email or password. Please verify your credentials and try again.';
      } else if (err.code === 'auth/internal-error') {
        localizedError = 'An internal system mismatch occurred in the Firebase interface (internal-error). Please verify your password credentials or select register/login again.';
      } else if (err.code === 'auth/network-request-failed') {
        localizedError = 'Secure client transport request failed. Firebase was unable to establish a websocket link to Google Cloud (network-request-failed). Please check your internet connection.';
      }
      setErrorMsg(localizedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setSuccessMsg('Successfully linked Google Workspace account! Loading...');
        onAuthSuccess(result.user.email || '', result.accessToken);
      }
    } catch (err: any) {
      console.error('Firebase Web-Auth Error: ', err); // Explicitly log matching the checked prefix pattern
      const errorStr = err instanceof Error ? err.message : String(err);
      const errCode = err?.code || '';
      
      const isPopupBlockedOrClosed = 
        errorStr.includes('cancelled-popup-request') || 
        errorStr.includes('popup-closed-by-user') || 
        errorStr.includes('auth/cancelled-popup-request') ||
        errorStr.includes('popup-blocked') ||
        errorStr.includes('auth/popup-blocked') ||
        errCode === 'auth/popup-blocked' ||
        errCode === 'auth/cancelled-popup-request';

      // Keep UX friendly inside iframes where popup might get blocked
      if (errCode === 'auth/internal-error') {
        setErrorMsg('Authentication notice (Internal Error): Google oauth handshake encountered a config mismatch (auth/internal-error). Live domain callback lists may still be initializing. Registered/Email users are fully active below to enter your vault instantly!');
      } else if (errCode === 'auth/network-request-failed') {
        setErrorMsg('Authentication Request Failed (Network Error): The secure transport socket link to Google servers failed (auth/network-request-failed). Please verify your internet connection or reload the page.');
      } else if (isPopupBlockedOrClosed) {
        setErrorMsg('Authentication Notice: The Google sign-in popup window was blocked, closed, or restricted by browser security policies. To use Google Workspace credentials, please click the "Open in a new tab" button at the top-right of the preview interface. Alternatively, you can register and enter your secure vault using the Email & Password form below instantly!');
      } else {
        setErrorMsg(`Google Auth failure: ${errorStr}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-150 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-25 select-none pointer-events-none overflow-hidden">
        <PlasmaWave
          colors={["#f59e0b", "#4f46e5"]}
          speed1={0.03}
          speed2={0.035}
          focalLength={0.7}
          bend1={0.9}
          bend2={0.4}
          dir2={-1.0}
          rotationDeg={15}
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02)_0,transparent_100%)] pointer-events-none z-10"></div>

      <div className="w-full max-w-md space-y-8 relative z-20">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <WorkspaceLogo size={78} className="mx-auto" />
          <div className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/30 border border-amber-900/50 px-4 py-1.5 rounded-full font-mono">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Secure Vault Core</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-white font-sans">
            Workspace <span className="font-serif italic text-amber-400 font-normal">AI Sync</span>
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Configure encrypted note vaults, process summaries, and automate calendars with full cloud security.
          </p>
        </div>

        {/* Outer Auth Card */}
        <div className="bg-[#121212] rounded-3xl border border-zinc-800/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

          {/* Tab Selector */}
          <div className="flex bg-[#0a0a0a] rounded-xl p-1 mb-6 border border-zinc-800/40">
            <button
              onClick={() => {
                setIsRegister(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all ${
                !isRegister 
                  ? 'bg-amber-950/35 border border-amber-900/40 text-amber-400 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all ${
                isRegister 
                  ? 'bg-amber-950/35 border border-amber-900/40 text-amber-400 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3.5 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start space-x-2.5 text-left"
              >
                <AlertCircle className="h-4.5 w-4.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-200 leading-relaxed font-sans">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3.5 bg-emerald-950/20 border border-emerald-900/50 rounded-xl flex items-start space-x-2.5 text-left"
              >
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-emerald-200 leading-relaxed font-sans">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold font-mono text-zinc-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vjathin Bhargav"
                    className={`w-full bg-[#0a0a0a]/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden font-mono transition-all duration-200 ${
                      hasNameError 
                        ? 'border-red-500/50 focus:border-red-500 bg-red-950/5' 
                        : 'border-zinc-800 hover:border-zinc-700 focus:border-amber-500/50'
                    }`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold font-mono text-zinc-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full bg-[#0a0a0a]/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden font-mono transition-all duration-200 ${
                    hasEmailError 
                      ? 'border-red-500/50 focus:border-red-500 bg-red-950/5' 
                      : 'border-zinc-800 hover:border-zinc-700 focus:border-amber-500/50'
                  }`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold font-mono text-zinc-400 uppercase tracking-wider">Passphrase</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 alphanumeric"
                  className={`w-full bg-[#0a0a0a]/80 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-hidden font-mono transition-all duration-200 ${
                    hasPasswordError 
                      ? 'border-red-500/50 focus:border-red-500 bg-red-950/5' 
                      : 'border-zinc-800 hover:border-zinc-700 focus:border-amber-500/50'
                  }`}
                  disabled={isLoading}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Recover Link Actions */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center space-x-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-850 bg-[#0a0a0a] text-amber-500 focus:ring-amber-500/25 h-3.5 w-3.5"
                />
                <span className="text-[11px] font-medium font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Remember Me
                </span>
              </label>

              {!isRegister && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResetLoading || isLoading}
                  className="text-[11px] font-bold font-mono text-amber-400/90 hover:text-amber-300 hover:underline focus:outline-hidden disabled:text-zinc-650 transition-colors"
                >
                  {isResetLoading ? 'Sending Reset link...' : 'Forgot Passphrase?'}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black rounded-xl text-xs font-bold font-mono flex items-center justify-center transition-all shadow-md shadow-amber-500/5 ${
                isLoading ? 'cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : isRegister ? (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  GENERATE AGENT IDENTITY
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  AUTHENTICATE VAULT
                </>
              )}
            </button>
          </form>

          {/* Separator line */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/60"></div>
            </div>
            <span className="relative bg-[#121212] px-3 text-[10px] font-bold font-mono uppercase text-zinc-500 tracking-wider">
              Secure Credentials Federation
            </span>
          </div>

          {/* Social login - Sign in with Google */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white rounded-xl text-xs font-semibold font-mono flex items-center justify-center transition-all hover:border-zinc-700 active:bg-zinc-950"
          >
            {/* Custom high-fidelity Google Icon SVG */}
            <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign In with Google
          </button>
          
          <div className="mt-5 p-2 bg-amber-955/5 border border-amber-900/15 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono text-center">
              * Note: To enable email/password signups in Firebase, please confirm "Email/Password" is activated in your Firebase Authentication &rarr; Sign-in methods console.
            </p>
          </div>
        </div>

        {/* Footer info lock badge */}
        <div className="flex items-center justify-center space-x-2 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
          <span>AES-256 On-Device Vault Guard Ready</span>
        </div>
      </div>
    </div>
  );
}
