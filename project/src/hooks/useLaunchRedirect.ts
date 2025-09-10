// hooks/useLaunchRedirect.ts
import { useEffect } from 'react';
import { getMyPreferences } from '../api/me';
import { MODULES } from '../shared/modules';

export function useLaunchRedirect() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prefs = await getMyPreferences();
        const def = prefs?.defaultModule;
        if (mounted && def && def !== 'doc') {
          // Redirection vers le module par défaut
          window.location.href = MODULES[def].path;
        }
      } catch (error) {
        console.error('Erreur lors de la redirection:', error);
      }
    })();
    return () => { mounted = false; };
  }, []);
}