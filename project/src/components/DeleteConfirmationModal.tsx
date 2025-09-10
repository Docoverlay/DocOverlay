import { Trash2, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import ButtonGroup from './ui/ButtonGroup';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  documentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  documentName, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <div 
        role="dialog"
        aria-modal="true" 
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 id="dialog-title" className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
            <p id="dialog-description" className="text-sm text-gray-600">Cette action est irréversible</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Êtes-vous sûr de vouloir supprimer la feuille :
          </p>
          <div className="p-3 bg-gray-50 rounded-md border-l-4 border-red-500">
            <p className="font-medium text-gray-900">{documentName}</p>
          </div>
          <p className="text-sm text-red-600 mt-3">
            ⚠️ Cette action supprimera définitivement la feuille et toutes ses données associées.
          </p>
        </div>

        {/* Actions */}
        <ButtonGroup className="w-full">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button variant="danger" leadingIcon={<Trash2 className="w-4 h-4" />} onClick={onConfirm} className="flex-1">
            Supprimer
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}