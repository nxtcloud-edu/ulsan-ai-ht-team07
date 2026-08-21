export default function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
      aria-label="코스를 생성하고 있습니다"
    >
      <div className="text-center space-y-4 animate-pulse">
        <div className="text-5xl">🎲</div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-navy">코스를 짜고 있어요...</p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
