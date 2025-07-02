export function Badge({ className = "", ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-muted text-white ${className}`}
      {...props}
    />
  );
}
