// Utilitaires pour convertir les documents Word et PDF en images
// Version on-prem avec pdfjs-dist local
import mammoth from 'mammoth';

export interface ConvertedDocument {
  pages: string[]; // URLs des images converties
  currentPage: number;
  totalPages: number;
  originalFileName: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'image';
}

export interface ConversionProgress {
  stage: 'reading' | 'converting' | 'rendering' | 'complete';
  progress: number; // 0-100
  message: string;
}

// Convertir un fichier PDF en images
export const convertPdfToImages = async (
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConvertedDocument> => {
  try {
    // S'assurer que PDF.js est disponible
    const w = window as any;
    if (!w.pdfjsLib) {
      // Charger PDF.js bootstrap si pas encore fait
      await import('../pdf/PdfBootstrap');
    }
    
    const pdfjs = w.pdfjsLib;
    if (!pdfjs) {
      throw new Error('PDF.js n\'est pas disponible. Veuillez recharger la page.');
    }
    
    onProgress?.({ stage: 'reading', progress: 10, message: 'Lecture du fichier PDF...' });
    
    const arrayBuffer = await file.arrayBuffer();
    
    onProgress?.({ stage: 'converting', progress: 30, message: 'Analyse du document...' });
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const pages: string[] = [];
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.({ 
        stage: 'rendering', 
        progress: 30 + (pageNum / totalPages) * 60, 
        message: `Conversion page ${pageNum}/${totalPages}...` 
      });
      
      const page = await pdf.getPage(pageNum);
      const scale = 2; // Haute résolution pour un positionnement précis
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Impossible de créer le contexte canvas');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convertir en image
      const imageUrl = canvas.toDataURL('image/png', 0.95);
      pages.push(imageUrl);
    }
    
    onProgress?.({ stage: 'complete', progress: 100, message: 'Conversion terminée !' });
    
    return {
      pages,
      currentPage: 0,
      totalPages,
      originalFileName: file.name,
      fileType: 'pdf'
    };
  } catch (error) {
    console.error('Erreur lors de la conversion PDF:', error);
    throw new Error(`Impossible de convertir le fichier PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Convertir un fichier Word (.docx) en image
export const convertDocxToImage = async (
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConvertedDocument> => {
  try {
    onProgress?.({ stage: 'reading', progress: 10, message: 'Lecture du fichier Word...' });
    
    const arrayBuffer = await file.arrayBuffer();
    
    onProgress?.({ stage: 'converting', progress: 30, message: 'Conversion en HTML...' });
    
    // Convertir le DOCX en HTML avec Mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlContent = result.value;
    
    onProgress?.({ stage: 'rendering', progress: 70, message: 'Génération de l\'image...' });
    
    // Créer un élément temporaire pour rendre le HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.cssText = `
      width: 794px; /* Largeur A4 en pixels à 96 DPI */
      min-height: 1123px; /* Hauteur A4 en pixels à 96 DPI */
      padding: 40px;
      background: white;
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: black;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `;
    
    document.body.appendChild(tempDiv);
    
    // Utiliser html2canvas pour convertir en image
    const html2canvas = await import('html2canvas');
    const canvas = await html2canvas.default(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    document.body.removeChild(tempDiv);
    
    const imageUrl = canvas.toDataURL('image/png', 0.95);
    
    onProgress?.({ stage: 'complete', progress: 100, message: 'Conversion terminée !' });
    
    return {
      pages: [imageUrl],
      currentPage: 0,
      totalPages: 1,
      originalFileName: file.name,
      fileType: 'docx'
    };
  } catch (error) {
    console.error('Erreur lors de la conversion DOCX:', error);
    throw new Error(`Impossible de convertir le fichier Word: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Convertir un fichier .doc (ancien format Word) en image
export const convertDocToImage = async (
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConvertedDocument> => {
  try {
    onProgress?.({ stage: 'reading', progress: 10, message: 'Lecture du fichier .doc...' });
    
    onProgress?.({ stage: 'converting', progress: 30, message: 'Conversion du format .doc...' });
    
    onProgress?.({ stage: 'rendering', progress: 70, message: 'Génération de l\'image...' });
    
    // Créer un conteneur temporaire
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      width: 794px; /* Largeur A4 en pixels à 96 DPI */
      min-height: 1123px; /* Hauteur A4 en pixels à 96 DPI */
      padding: 40px;
      background: white;
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: black;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `;
    
    document.body.appendChild(tempDiv);
    
    // Créer directement un message d'information pour les fichiers .doc
    tempDiv.innerHTML = `
      <div style="text-align: center; padding: 50px; border: 2px dashed #ccc; margin: 20px;">
        <h2 style="color: #666; margin-bottom: 20px;">Document .doc détecté</h2>
        <p style="color: #888; margin-bottom: 15px;">
          Ce fichier .doc utilise un format binaire ancien qui peut être difficile à convertir.
        </p>
        <p style="color: #888; margin-bottom: 15px;">
          Pour une meilleure compatibilité, veuillez convertir ce fichier en .docx 
          dans Microsoft Word (Fichier > Enregistrer sous > Format .docx).
        </p>
      </div>
    `;
    
    // Utiliser html2canvas pour convertir le message en image
    const html2canvas = await import('html2canvas');
    const canvas = await html2canvas.default(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    document.body.removeChild(tempDiv);
    
    const imageUrl = canvas.toDataURL('image/png', 0.95);
    
    onProgress?.({ stage: 'complete', progress: 100, message: 'Document .doc chargé avec avertissement' });
    
    return {
      pages: [imageUrl],
      currentPage: 0,
      totalPages: 1,
      originalFileName: file.name,
      fileType: 'doc'
    };
  } catch (error) {
    console.error('Erreur lors de la conversion .doc:', error);
    throw new Error(
      'Impossible de convertir le fichier .doc. ' +
      'Ce format ancien peut présenter des difficultés de conversion. ' +
      'Essayez de convertir le fichier en .docx dans Microsoft Word pour de meilleurs résultats.'
    );
  }
};

// Fonction principale de conversion selon le type de fichier
export const convertDocumentToImages = async (
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConvertedDocument> => {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  
  // Vérifier le type de fichier
  if (!fileExtension) {
    throw new Error('Impossible de déterminer le type de fichier.');
  }
  
  switch (fileExtension) {
    case 'pdf':
      return convertPdfToImages(file, onProgress);
    
    case 'docx':
      return convertDocxToImage(file, onProgress);
    
    case 'doc':
      return convertDocToImage(file, onProgress);
    
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
      // Pour les images, pas de conversion nécessaire
      return new Promise((resolve) => {
        onProgress?.({ stage: 'reading', progress: 50, message: 'Chargement de l\'image...' });
        const reader = new FileReader();
        reader.onload = (e) => {
          onProgress?.({ stage: 'complete', progress: 100, message: 'Image chargée !' });
          resolve({
            pages: [e.target?.result as string],
            currentPage: 0,
            totalPages: 1,
            originalFileName: file.name,
            fileType: 'image'
          });
        };
        reader.readAsDataURL(file);
      });
    
    default:
      throw new Error(
        `Type de fichier non supporté: .${fileExtension}. ` +
        'Formats acceptés: .pdf, .docx, .doc, .jpg, .png, .gif, .bmp, .webp'
      );
  }
};

// Utilitaire pour vérifier si un fichier est supporté
export const isSupportedFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const supportedExtensions = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const fileExtension = fileName.split('.').pop();
  
  return fileExtension ? supportedExtensions.includes(fileExtension) : false;
};

// Obtenir une description du type de fichier
export const getFileTypeDescription = (file: File): string => {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  
  switch (fileExtension) {
    case 'pdf':
      return 'Document PDF';
    case 'docx':
      return 'Document Word (.docx)';
    case 'doc':
      return 'Document Word (.doc)';
    case 'jpg':
    case 'jpeg':
      return 'Image JPEG';
    case 'png':
      return 'Image PNG';
    case 'gif':
      return 'Image GIF';
    case 'bmp':
      return 'Image BMP';
    case 'webp':
      return 'Image WebP';
    default:
      return 'Fichier non reconnu';
  }
};