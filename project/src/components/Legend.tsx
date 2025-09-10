import { Info, Zap } from 'lucide-react';

export default function Legend() {
  const legendItems = [
    { color: 'bg-red-300', label: 'Déverrouillé + sans code' },
    { color: 'bg-blue-300', label: 'Déverrouillé + avec code' },
    { color: 'bg-orange-300', label: 'Verrouillé + sans code' },
    { color: 'bg-green-300', label: 'Verrouillé + avec code' }
  ];

  return (
    <div className="flex justify-center mb-6">
      <div className="bg-white rounded-lg shadow-md p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-700">Légende</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${item.color} border`} />
            <span className="text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Zap className="w-3 h-3 text-orange-600" />
          <span>Utilisez la détection automatique pour créer des zones à partir de rectangles imprimés</span>
        </div>
      </div>
    </div>
    </div>
  );
}