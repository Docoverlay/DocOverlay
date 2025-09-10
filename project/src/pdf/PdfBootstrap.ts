/**
 * Configuration PDF.js locale (on-prem, sans CDN)
 * À importer uniquement dans les vues qui utilisent PDF
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for on-prem usage with fallback
try {
  // Essayer d'abord le worker local
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch {
  // Fallback to CDN if local worker fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Exposer pdfjsLib sur window pour les autres modules
(window as any).pdfjsLib = pdfjsLib;

console.log('📄 PDF.js configuré et exposé sur window.pdfjsLib');