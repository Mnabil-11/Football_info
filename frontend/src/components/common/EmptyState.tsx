interface EmptyStateProps {
  message: string;
  icon?: string;
}

const EmptyState = ({ message, icon = '⚽' }: EmptyStateProps) => (
  <div className="text-center py-10 text-gray-500">
    <div className="text-4xl mb-2">{icon}</div>
    <p>{message}</p>
  </div>
);

export default EmptyState;
