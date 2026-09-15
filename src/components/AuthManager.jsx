import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { modalRegistry } from '../utils/modalRegistry';
import AuthModal from './AuthModal';

export default function AuthManager({ showAuth, setShowAuth, isWizardActive }) {
  const { isGuest, loading } = useAuth();
  const [promptCount, setPromptCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // If loading, not a guest, or the wizard is currently active, pause the auth prompt timer.
    if (loading || !isGuest || isWizardActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (!showAuth) {
      // Calculate wait time: 
      // First time = 10 seconds (gives breathing room after Welcome Tour)
      // Subsequent = 10m, 20m, 30m, etc.
      const waitTimeMs = promptCount === 0 ? 10000 : promptCount * 10 * 60 * 1000;

      timerRef.current = setTimeout(() => {
        setShowAuth(true);
      }, waitTimeMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGuest, loading, showAuth, promptCount, isWizardActive, setShowAuth]);

  useEffect(() => {
    if (showAuth) {
      modalRegistry.push('auth_modal', handleClose);
    } else {
      modalRegistry.remove('auth_modal');
    }
    return () => modalRegistry.remove('auth_modal');
  }, [showAuth]);

  const handleClose = () => {
    setShowAuth(false);
    setPromptCount(prev => prev + 1);
  };

  const handleSuccess = () => {
    setShowAuth(false);
  };

  if (!showAuth) return null;

  return (
    <AuthModal
      isOpen={showAuth}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}
