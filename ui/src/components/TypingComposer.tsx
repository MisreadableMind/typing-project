import { useRef, useEffect, useMemo } from 'react';

interface TypingComposerProps {
  text: string;
  typed: string;
  onInput: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TypingComposer({
  text,
  typed,
  onInput,
  disabled = false,
  autoFocus = true,
}: TypingComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Tab to be typed
    if (e.key === 'Tab') {
      e.preventDefault();
      onInput(typed + '\t');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInput(e.target.value);
  };

  const handleFocus = () => {
    textareaRef.current?.focus();
  };

  const renderedText = useMemo(() => {
    const elements: JSX.Element[] = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const typedChar = typed[i];
      const isCurrent = i === typed.length;

      let className = 'typing-pending';
      let displayChar = char;

      // Handle whitespace display
      if (char === ' ') {
        displayChar = ' ';
      } else if (char === '\n') {
        displayChar = '↵\n';
      } else if (char === '\t') {
        displayChar = '→   ';
      }

      if (typedChar !== undefined) {
        if (typedChar === char) {
          className = 'typing-correct';
        } else {
          className = 'typing-incorrect';
        }
      }

      if (isCurrent) {
        className += ' typing-current';
      }

      elements.push(
        <span key={i} className={className}>
          {displayChar}
        </span>
      );
    }

    // Show extra typed characters (errors beyond text length)
    if (typed.length > text.length) {
      for (let i = text.length; i < typed.length; i++) {
        elements.push(
          <span key={`extra-${i}`} className="typing-incorrect">
            {typed[i]}
          </span>
        );
      }
    }

    return elements;
  }, [text, typed]);

  return (
    <div
      className="relative bg-black/50 p-6 cursor-text border-2 border-gray-600"
      onClick={handleFocus}
    >
      {/* Display layer */}
      <div className="font-mono text-xl leading-relaxed whitespace-pre-wrap break-words select-none">
        {renderedText}
      </div>

      {/* Hidden textarea for input */}
      <textarea
        ref={textareaRef}
        value={typed}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Focus indicator */}
      {!disabled && (
        <div className="absolute bottom-2 right-2 retro-text text-xs text-gray-500 retro-blink">
          CLICK TO TYPE
        </div>
      )}
    </div>
  );
}
