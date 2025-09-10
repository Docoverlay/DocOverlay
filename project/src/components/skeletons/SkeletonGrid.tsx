export default function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </div>
      ))}
    </div>
  );
}