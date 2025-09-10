import { useEffect, useRef } from 'react';

/**
 * Hook pour sauvegarder automatiquement l'état dans localStorage (Effet Zeigarnik)
 * Permet la reprise de travail après refresh/fermeture
 */
export function useDraft<T>(key: string, state: T, delay = 500) {
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn('Impossible de sauvegarder le brouillon:', error);
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [key, state, delay]);
}

/**
 * Charger un brouillon depuis localStorage
 */
export function loadDraft<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Supprimer un brouillon
 */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Impossible de supprimer le brouillon:', error);
  }
}