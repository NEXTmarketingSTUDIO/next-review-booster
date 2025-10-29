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
    if (isAuthenticated() && user?.email) {
      // Cache na 15 minut - nie pobieraj uprawnień częściej niż co 15 minut
      const now = Date.now();
      const cacheTime = 15 * 60 * 1000; // 15 minut w milisekundach
      
      // Sprawdź czy są w localStorage
      const cachedPermission = localStorage.getItem(`permission_${user.email}`);
      const cachedTime = localStorage.getItem(`permission_time_${user.email}`);
      
      if (cachedPermission && cachedTime && (now - parseInt(cachedTime)) < cacheTime) {
        // Użyj cache z localStorage
        setPermission(cachedPermission);
        setLoading(false);
      } else if (!isFetching) {
        // Pobierz uprawnienia z API
        fetchUserPermission();
      }
    } else {
      setPermission(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]); // Tylko email jako zależność

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
        
        // Zapisz do localStorage
        localStorage.setItem(`permission_${user.email}`, response.permission);
        localStorage.setItem(`permission_time_${user.email}`, Date.now().toString());
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
