export function Table({ className = "", ...props }) {
  return (
    <table className={`min-w-full text-sm ${className}`} {...props} />
  );
}

export function TableHeader({ className = "", ...props }) {
  return (
    <thead className={`bg-card border-b border-border ${className}`} {...props} />
  );
}

export function TableRow({ className = "", ...props }) {
  return (
    <tr className={`hover:bg-background transition-colors ${className}`} {...props} />
  );
}

export function TableCell({ className = "", ...props }) {
  return (
    <td className={`px-4 py-2 border-b border-border ${className}`} {...props} />
  );
}

export function TableBody({ className = "", ...props }) {
  return (
    <tbody className={className} {...props} />
  );
}
