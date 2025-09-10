import { X, HelpCircle, User, Shield, FileText, Eye, Play, Edit } from 'lucide-react';

interface HelpModalProps {
  userRole: 'SUPERADMIN' | 'ADMIN' | 'USER';
  onClose: () => void;
}

export default function HelpModal({ userRole, onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Aide - {userRole === 'admin' ? 'Administrateur' : 'Utilisateur'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[70vh]">
          {userRole === 'SUPERADMIN' ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rôle Super Administrateur</h3>
                  <p className="text-gray-600 text-sm">
                    Accès complet au système : création/modification de feuilles, encodage, export de données, 
                    logs d'audit et gestion des comptes utilisateurs.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Gestion des feuilles
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Créer une nouvelle feuille :</strong> Utilisez le bouton "Créer une nouvelle feuille" pour accéder à l'éditeur</li>
                  <li>• <strong>Modifier une feuille :</strong> Cliquez sur "Modifier" dans la liste des feuilles</li>
                  <li>• <strong>Aperçu :</strong> Utilisez "Aperçu" pour voir la feuille sans la modifier</li>
                  <li>• <strong>Supprimer :</strong> Cliquez sur "Supprimer" pour retirer définitivement une feuille</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Gestion des utilisateurs
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Créer des comptes :</strong> Ajoutez de nouveaux administrateurs et utilisateurs</li>
                  <li>• <strong>Valider les comptes :</strong> Approuvez ou rejetez les demandes de compte</li>
                  <li>• <strong>Gérer les statuts :</strong> Activez ou désactivez les comptes utilisateurs</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Éditeur de feuilles
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Charger une image :</strong> Utilisez "Charger image" pour définir l'arrière-plan</li>
                  <li>• <strong>Ajouter des zones :</strong> Cliquez sur "Ajouter case" pour créer des zones interactives</li>
                  <li>• <strong>Configurer les zones :</strong> Clic droit sur une zone pour la configurer (code, taille, verrouillage)</li>
                  <li>• <strong>Déplacer/Redimensionner :</strong> Glissez les zones ou utilisez les poignées de redimensionnement</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Export et audit
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Exports manuels :</strong> Générez des fichiers CSV/MRT instantanément</li>
                  <li>• <strong>Planifications :</strong> Configurez des exports automatiques</li>
                  <li>• <strong>Logs d'audit :</strong> Consultez l'historique complet des actions RGPD</li>
                </ul>
              </div>
            </div>
          ) : userRole === 'ADMIN' ? (
            <div className="space-y-6">
              
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rôle Administrateur</h3>
                  <p className="text-gray-600 text-sm">
                    Accès à la création et modification des feuilles interactives, ainsi qu'à l'encodage des prestations.
                    Pas d'accès aux exports de données ni aux logs d'audit.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Gestion des feuilles
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Créer une nouvelle feuille :</strong> Utilisez le bouton "Créer une nouvelle feuille" pour accéder à l'éditeur</li>
                  <li>• <strong>Modifier une feuille :</strong> Cliquez sur "Modifier" dans la liste des feuilles</li>
                  <li>• <strong>Aperçu :</strong> Utilisez "Aperçu" pour voir la feuille sans la modifier</li>
                  <li>• <strong>Supprimer :</strong> Cliquez sur "Supprimer" pour retirer définitivement une feuille</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Éditeur de feuilles
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Charger une image :</strong> Utilisez "Charger image" pour définir l'arrière-plan</li>
                  <li>• <strong>Ajouter des zones :</strong> Cliquez sur "Ajouter case" pour créer des zones interactives</li>
                  <li>• <strong>Configurer les zones :</strong> Clic droit sur une zone pour la configurer (code, taille, verrouillage)</li>
                  <li>• <strong>Déplacer/Redimensionner :</strong> Glissez les zones ou utilisez les poignées de redimensionnement</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Encodage des prestations
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Sélection d'étage :</strong> Choisissez l'étage du patient</li>
                  <li>• <strong>Sélection du patient :</strong> Choisissez le patient dans la liste</li>
                  <li>• <strong>Encodage :</strong> Cliquez sur les zones pour les cocher/décocher</li>
                  <li>• <strong>Sauvegarde :</strong> Sauvegardez vos encodages</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rôle Utilisateur</h3>
                  <p className="text-gray-600 text-sm">
                    En tant qu'utilisateur, vous pouvez encoder les prestations pour les patients 
                    en utilisant les feuilles créées par les administrateurs.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Processus d'encodage</h4>
                <ol className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                    <div>
                      <strong>Commencer l'encodage :</strong> Cliquez sur "Commencer l'encodage" sur le tableau de bord
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                    <div>
                      <strong>Sélectionner le site :</strong> Choisissez le site (Delta, HBW, SARE)
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                    <div>
                      <strong>Sélectionner l'étage :</strong> Choisissez l'étage (Chirurgie, Médecine, Réa)
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                    <div>
                      <strong>Choisir le patient :</strong> Sélectionnez le patient dans la liste avec ses informations (nom, chambre, lit)
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                    <div>
                      <strong>Sélectionner la catégorie :</strong> Choisissez la catégorie de prestations
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">6</span>
                    <div>
                      <strong>Sélectionner la feuille :</strong> Choisissez la feuille de prestations appropriée
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">7</span>
                    <div>
                      <strong>Encoder les prestations :</strong> Cliquez sur les zones correspondant aux prestations réalisées
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">8</span>
                    <div>
                      <strong>Sauvegarder :</strong> Sauvegardez votre travail d'encodage
                    </div>
                  </li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Fonctionnalités disponibles
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 ml-6">
                  <li>• <strong>Aperçu des feuilles :</strong> Visualisez les feuilles avant de les utiliser</li>
                  <li>• <strong>Historique :</strong> Consultez vos encodages récents</li>
                  <li>• <strong>Favoris :</strong> Marquez vos feuilles préférées pour un accès rapide</li>
                  <li>• <strong>Sauvegarde automatique :</strong> Vos modifications sont sauvegardées automatiquement</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Codes couleur des zones</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-300 border border-red-500" />
                <span className="text-gray-700">Zone sans code</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-300 border border-blue-500" />
                <span className="text-gray-700">Zone avec code</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-500" />
                <span className="text-gray-700">Zone cochée + code</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-orange-300 border border-orange-500" />
                <span className="text-gray-700">Zone verrouillée</span>
              </div>
            </div>
            
            {userRole === 'SUPERADMIN' && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2">Permissions par rôle</h5>
                <div className="space-y-1 text-xs text-blue-800">
                  <div><strong>Super Admin:</strong> Toutes les fonctionnalités + gestion utilisateurs + exports + audit</div>
                  <div><strong>Admin:</strong> Création/modification de feuilles + encodage</div>
                  <div><strong>User:</strong> Encodage uniquement</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Fermer l'aide
          </button>
        </div>
      </div>
    </div>
  );
}