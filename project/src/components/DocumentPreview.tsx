import { X, FileText } from 'lucide-react';
import { SavedDocument } from '../types';

interface DocumentPreviewProps {
  document: SavedDocument;
  onClose: () => void;
  userRole?: 'super_admin' | 'admin' | 'user';
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4">
      {/* Conteneur centré sans scroll */}
      <div className="relative inline-block bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Bouton Fermer (rouge) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-md z-10"
          aria-label="Fermer l’aperçu"
        >
          <X className="w-4 h-4" />
          <span>Fermer</span>
        </button>

        {/* Image ajustée à la fenêtre */}
        {document.backgroundImage ? (
          <img
            src={document.backgroundImage}
            alt={`Aperçu de ${document.name ?? 'document'}`}
            className="block max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center w-[70vw] h-[60vh] text-gray-500">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Aucune image disponible</p>
              <p className="text-sm">Ce document n’a pas d’aperçu d’image.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;
