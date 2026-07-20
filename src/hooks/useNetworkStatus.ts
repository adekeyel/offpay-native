import { useEffect, useState } from 'react';
import { getIsOnline, subscribeToConnectivity } from '../offline/connectivity';

/**
 * Tracks whether recent API calls have actually been able to reach the
 * server. No native module involved — safe to use anywhere without a
 * native rebuild.
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setOnline] = useState(getIsOnline());

  useEffect(() => subscribeToConnectivity(setOnline), []);

  return { isOnline };
}
