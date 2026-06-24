import { useState } from 'react';
import { Button, TextInput } from '@patternfly/react-core';
import { X } from 'lucide-react';

interface TagsInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxItems?: number;
}

export function TagsInput({
  id,
  value,
  onChange,
  placeholder = 'Enter value',
  disabled = false,
  maxItems,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const tag = inputValue.trim();
    if (!tag || value.includes(tag)) return;
    if (maxItems !== undefined && value.length >= maxItems) return;
    onChange([...value, tag]);
    setInputValue('');
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const atMax = maxItems !== undefined && value.length >= maxItems;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput
          id={id}
          value={inputValue}
          onChange={(_event, v) => setInputValue(v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          isDisabled={disabled || atMax}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAdd} isDisabled={disabled || atMax || !inputValue.trim()}>
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                disabled={disabled}
                className="hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
