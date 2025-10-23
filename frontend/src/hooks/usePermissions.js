import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import apiService from '../services/api';

const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && user) {
      // Cache na 5 minut - nie pobieraj uprawnień częściej niż co 5 minut
      const now = Date.now();
      const cacheTime = 5 * 60 * 1000; // 5 minut w milisekundach
      
      if (now - lastFetchTime > cacheTime && !isFetching) {
        fetchUserPermission();
      } else if (permission === null) {
        // Jeśli nie ma uprawnień w cache, pobierz je
        fetchUserPermission();
      } else {
        // Jeśli mamy uprawnienia w cache, nie ładuj ponownie
        setLoading(false);
      }
    } else {
      setPermission(null);
      setLoading(false);
    }
  }, [user, isAuthenticated, lastFetchTime, isFetching, permission]);

  const fetchUserPermission = async () => {
    if (!user || isFetching) return;
    
    setIsFetching(true);
    setLoading(true);
    setError(null);
    
    try {
      // Pobierz rzeczywiste uprawnienia z API
      const response = await apiService.getUserPermissionByEmail(user.email);
      if (response.success) {
        setPermission(response.permission);
        setLastFetchTime(Date.now()); // Zaktualizuj czas ostatniego pobrania
        console.log('✅ Uprawnienia użytkownika:', response.permission);
      } else {
        setError(response.error || 'Błąd pobierania uprawnień');
        setPermission('Demo'); // Domyślnie Demo
      }
    } catch (err) {
      console.error('❌ Błąd pobierania uprawnień:', err);
      setError('Błąd połączenia z serwerem');
      setPermission('Demo'); // Domyślnie Demo
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Sprawdź czy użytkownik ma określone uprawnienia
  const hasPermission = (requiredPermission) => {
    if (!permission) return false;
    
    const permissionHierarchy = {
      'Admin': 4,
      'Professional': 3,
      'Starter': 2,
      'Demo': 1
    };
    
    const userLevel = permissionHierarchy[permission] || 1;
    const requiredLevel = permissionHierarchy[requiredPermission] || 1;
    
    return userLevel >= requiredLevel;
  };

  // Sprawdź czy użytkownik jest administratorem
  const isAdmin = () => {
    return hasPermission('Admin');
  };

  // Sprawdź czy użytkownik ma uprawnienia Professional lub wyższe
  const isProfessional = () => {
    return hasPermission('Professional');
  };

  // Sprawdź czy użytkownik ma uprawnienia Starter lub wyższe
  const isStarter = () => {
    return hasPermission('Starter');
  };

  // Funkcja do ręcznego odświeżenia uprawnień (ignoruje cache)
  const refreshPermissions = async () => {
    setLastFetchTime(0); // Reset cache
    await fetchUserPermission();
  };

  return {
    permission,
    loading,
    error,
    hasPermission,
    isAdmin,
    isProfessional,
    isStarter,
    refreshPermissions
  };
};

export default usePermissions;
