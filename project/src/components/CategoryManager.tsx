import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, Folder, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CategoryManagerProps {
  onClose: () => void;
  userId: string;
}

export default function CategoryManager({ onClose, userId }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  const handleSaveCategory = () => {
    if (!newCategory.name.trim()) {
      alert('Veuillez saisir un nom pour la catégorie.');
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      color: newCategory.color,
      description: newCategory.description
    };

    setCategories(prev => [...prev, category]);
    setNewCategory({ name: '', color: '#3B82F6', description: '' });
    setShowNewCategory(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      description: category.description || ''
    });
    setShowNewCategory(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Supprimer cette catégorie ?')) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Folder className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestion des catégories</h2>
              <p className="text-sm text-gray-600">Organisez vos feuilles par catégories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle catégorie
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune catégorie créée
              </h3>
              <p className="text-gray-600 mb-6">
                Créez des catégories pour organiser vos feuilles
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal nouvelle catégorie */}
        {showNewCategory && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Ex: Consultations"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Description de la catégorie..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewCategory(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', color: '#3B82F6', description: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingCategory ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}