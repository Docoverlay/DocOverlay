export default function SkeletonViewer() {
  return (
    <div className="space-y-4">
      <div className="h-16 bg-gray-200 rounded-md animate-pulse" />
      <div className="h-[60vh] bg-gray-200 rounded-md animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}