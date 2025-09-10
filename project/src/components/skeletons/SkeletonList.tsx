export default function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded-md animate-pulse" />
      ))}
    </div>
  );
}