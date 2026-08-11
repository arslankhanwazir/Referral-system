type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  defaultValue?: string;
};

export default function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required,
  placeholder,
  error,
  defaultValue,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className="rounded-card border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-warn">
          {error}
        </p>
      )}
    </div>
  );
}
