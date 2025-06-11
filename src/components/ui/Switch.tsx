import { useState } from 'react';

interface SwitchProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Switch({ defaultChecked = false, onChange }: SwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleToggle = () => {
    const newValue = !checked;
    setChecked(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-foreground' : 'bg-muted'
      }`}
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
