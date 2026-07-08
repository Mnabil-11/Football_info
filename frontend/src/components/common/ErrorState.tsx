interface ErrorStateProps {
  message: string;
  /** Optional retry handler; renders a button when provided. */
  onRetry?: () => void;
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="flex items-center justify-center py-10">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
      <h2 className="text-red-800 font-semibold text-lg mb-2">حدث خطأ</h2>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  </div>
);

export default ErrorState;
