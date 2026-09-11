import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { identifyUser, resetUser, trackEvent } from '../utils/telemetry';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides:
 *   - user        : Current Supabase user or null
 *   - session     : Full session object
 *   - loading     : true during initial session check
 *   - signOut()   : Signs user out
 *   - isGuest     : true if user hasn't signed in (localStorage-only mode)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const linkOneSignal = (user) => {
    if (window.OneSignalDeferred && user) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.login(user.id);
          if (user.email) {
            await OneSignal.User.addEmail(user.email);
          }
          // Note: Push prompt is deferred — triggered after user adds their first asset
        } catch (err) {
          console.error('OneSignal login error:', err);
        }
      });
    }
  };

  const unlinkOneSignal = () => {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.logout();
        } catch (err) {
          console.error('OneSignal logout error:', err);
        }
      });
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // No Supabase configured: run as Guest only
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        identifyUser(session.user.id, session.user.email);
        trackEvent('app_opened', { auth_status: 'signed_in' });
        linkOneSignal(session.user);
      } else {
        trackEvent('app_opened', { auth_status: 'guest' });
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        identifyUser(session.user.id, session.user.email);
        trackEvent('login_completed', { provider: session.user.app_metadata?.provider || 'email' });
        linkOneSignal(session.user);
      } else if (event === 'SIGNED_OUT') {
        resetUser();
        trackEvent('logout_completed');
        unlinkOneSignal();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    resetUser();
    unlinkOneSignal();
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isGuest: !user,
    isConfigured: isSupabaseConfigured(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
