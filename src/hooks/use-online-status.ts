import { useSyncStore } from '@/store/sync-store';
import { useEffect } from 'react';

export function useOnlineStatus() {
  const { setOnlineStatus } = useSyncStore();

  useEffect(() => {
    setOnlineStatus(navigator.onLine);

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);
  
  return useSyncStore(state => state.isOnline);
}
