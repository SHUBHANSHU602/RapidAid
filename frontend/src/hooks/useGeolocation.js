import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_COORDINATES } from '../utils/geo';
import toast from 'react-hot-toast';

export const useGeolocation = (options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) => {
  const [location, setLocation] = useState(DEFAULT_COORDINATES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser.');
      toast.error('Geolocation is not supported. Using default coordinates.');
      return Promise.resolve(DEFAULT_COORDINATES);
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(coords);
          setHasPermission(true);
          setIsLoading(false);
          resolve(coords);
        },
        (err) => {
          console.warn('Geolocation fetch error:', err.message);
          setError(err.message);
          setIsLoading(false);
          // Fallback to default
          resolve(DEFAULT_COORDINATES);
        },
        options
      );
    });
  }, [options]);

  useEffect(() => {
    // Attempt initial silent fetch
    getCurrentLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    getCurrentLocation,
    setLocation,
  };
};

export default useGeolocation;
