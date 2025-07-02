export function Button({ className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-cyan-600 transition-colors ${className}`}
      {...props}
    />
  );
}
