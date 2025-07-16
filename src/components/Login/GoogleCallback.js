import React, { useEffect } from 'react';
import LoadingSpinner from '../OnBoarding/LoadingSpinner';
import { useGoogleAuth } from './hooks/useGoogleAuth';

function GoogleCallback() {
  const { handleGoogleCallback } = useGoogleAuth();

  useEffect(() => {
    handleGoogleCallback();
  }, [handleGoogleCallback]);

  return <LoadingSpinner />;
}

export default GoogleCallback;
