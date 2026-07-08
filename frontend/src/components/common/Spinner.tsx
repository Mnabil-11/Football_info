interface SpinnerProps {
  /** Optional message shown under the spinner. */
  label?: string;
  /** When true, fills the viewport height and centers. */
  fullScreen?: boolean;
}

const Spinner = ({ label, fullScreen = false }: SpinnerProps) => (
  <div
    className={`flex items-center justify-center ${
      fullScreen ? 'min-h-screen' : 'py-10'
    }`}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
      {label && <p className="mt-3 text-gray-600 text-sm">{label}</p>}
    </div>
  </div>
);

export default Spinner;
