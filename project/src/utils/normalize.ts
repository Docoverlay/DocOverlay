/**
 * Utilitaires de normalisation pour la robustesse des entrées (Principe de Postel)
 */

export function normalizeString(input = ''): string {
  return input
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/\p{Diacritic}/gu, '') // Supprimer les diacritiques
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim()
    .toLowerCase();
}

export function normalizeDigits(input = ''): string {
  return input.replace(/[^\d]/g, '');
}

export function parseDateFlexible(input = ''): Date | null {
  const s = input.trim();
  if (!s) return null;
  
  // Essayer d'abord le format ISO
  const tryISO = new Date(s);
  if (!isNaN(+tryISO)) return tryISO;
  
  // Essayer les formats français courants: JJ/MM/AAAA, JJ.MM.AAAA, JJ-MM-AAAA
  const match = s.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{4})$/);
  if (match) {
    const [, day, month, year] = match.map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(+date) ? null : date;
  }
  
  return null;
}

export function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR');
}

export function normalizeNISS(input = ''): string {
  // Nettoyer et formater le NISS (Numéro d'Identification de la Sécurité Sociale)
  const digits = normalizeDigits(input);
  if (digits.length === 11) {
    // Format: YY.MM.DD.XXX.XX
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 9)}.${digits.slice(9, 11)}`;
  }
  return digits;
}