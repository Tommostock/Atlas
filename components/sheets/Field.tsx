// A small helper used by every form sheet: a label sitting above its
// input, with an optional hint line underneath. Keeps the forms tidy
// without repeating the same markup everywhere.

export default function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] leading-snug text-ink-faint">
          {hint}
        </span>
      )}
    </label>
  );
}
