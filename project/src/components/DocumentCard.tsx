import { Star, Eye, Play, Settings, Edit, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import { SavedDocument } from '../types';

type Props = {
  doc: SavedDocument;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPreview: () => void;
  onEncode: () => void;
  onCustomize: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canAdmin: boolean; // contrôle autorisation au clic, pas à l'affichage
};

export default function DocumentCard({
  doc,
  isFavorite,
  onToggleFavorite,
  onPreview,
  onEncode,
  onCustomize,
  onEdit,
  onDelete,
  canAdmin,
}: Props) {
  const displayName =
    (doc.name && doc.name.trim()) ||
    (doc.convertedDocument?.originalFileName?.replace(/\.[^.]+$/, '') ?? 'Feuille');

  const handleDelete = () => {
    if (!canAdmin) {
      alert("Action réservée aux administrateurs.");
      return;
    }
    onDelete();
  };

  const handleEdit = () => {
    if (!canAdmin) {
      alert("Action réservée aux administrateurs.");
      return;
    }
    onEdit();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Ligne 1 : Nom + étoile */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h3>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="p-1 rounded-md hover:bg-amber-50 transition-colors"
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star 
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'text-amber-500 fill-current' : 'text-slate-400'
            }`} 
          />
        </button>
      </div>

      {/* Ligne 2 : 5 boutons TOUJOURS visibles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Button size="sm" variant="secondary" onClick={onPreview}>
          <Eye className="w-4 h-4" />
          Aperçu
        </Button>
        <Button size="sm" variant="primary" onClick={onEncode}>
          <Play className="w-4 h-4" />
          Encoder
        </Button>
        <Button size="sm" variant="secondary" onClick={onCustomize}>
          <Settings className="w-4 h-4" />
          Personnaliser
        </Button>
        <Button size="sm" variant="secondary" onClick={handleEdit}>
          <Edit className="w-4 h-4" />
          Modifier
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete}>
          <Trash2 className="w-4 h-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}