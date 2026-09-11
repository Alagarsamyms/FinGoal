import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function AuthManager({ showAuth, setShowAuth, welcomeDone }) {
  const { isGuest, loading } = useAuth();
  const [promptCount, setPromptCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading || !isGuest || !welcomeDone) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (!showAuth) {
      // Calculate wait time: 
      // 0 = immediate, 1 = 10m, 2 = 20m, 3 = 30m, etc.
      const waitMinutes = promptCount === 0 ? 0 : promptCount * 10;
      const waitTimeMs = waitMinutes * 60 * 1000;

      timerRef.current = setTimeout(() => {
        setShowAuth(true);
      }, waitTimeMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGuest, loading, showAuth, promptCount, welcomeDone, setShowAuth]);

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
