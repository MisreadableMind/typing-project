import React, { useImperativeHandle, useLayoutEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import useRefCallback from "use-ref-callback";

const Composer = React.forwardRef<TComposerRef, TComposerProps>(function Composer(props, ref) {
  const { className, text, whiteSpaces, onInput, onMistake } = props;

  const lastServedInputRef = useRef(""); // Last value that was emitted to the onInput callback
  const lastServedMistakeRef = useRef<TComposerMistake | null>(null); // Last mistake that was emitted to the onMistake callback

  const inputRef = useRef<HTMLTextAreaElement>(null); // Editable part
  const completedChunksRef = useRef<string>(""); // Chunks that entered correctly
  const ongoingChunkRef = useRef<string>(""); // Chunk that needs to be entered now
  const completedTextRef = useRef<HTMLSpanElement>(null); // Correct part that cannot be edited
  const editingCorrectTextRef = useRef<HTMLSpanElement>(null);
  const editingWrongTextRef = useRef<HTMLSpanElement>(null);
  const editingRestTextRef = useRef<HTMLSpanElement>(null);
  const restTextRef = useRef<HTMLSpanElement>(null); // Part of text that need to be entered after the ongoing chunk

  const renderEditingText = useRefCallback(
    (p: { correct: string; wrong: string; rest: string; start: number; end: number; caret: number }) => {
      const { correct, wrong, rest, start, end, caret } = p;

      if (editingCorrectTextRef.current) {
        let chunk = correct;
        if (start === end) {
          if (start <= correct.length) {
            chunk = chunk.slice(0, start) + caretPlaceholder + chunk.slice(start);
          }
        } else if (start < correct.length) {
          if (end <= correct.length) {
            chunk =
              chunk.slice(0, end) +
              selectionEndPlaceholder +
              (caret === end ? caretPlaceholder : "") +
              chunk.slice(end);
          } else {
            chunk += selectionEndPlaceholder;
          }

          chunk =
            chunk.slice(0, start) +
            (caret === start ? caretPlaceholder : "") +
            selectionStartPlaceholder +
            chunk.slice(start);
        }

        chunk = formatOutput(chunk, whiteSpaces);

        if (start <= correct.length) {
          chunk = chunk
            .replace(caretPlaceholder, caretHtml)
            .replace(selectionStartPlaceholder, selectionStartHtml)
            .replace(selectionEndPlaceholder, selectionEndHtml);
        }

        editingCorrectTextRef.current.innerHTML = chunk;
      }

      if (editingWrongTextRef.current) {
        const offset = correct.length;
        let chunk = wrong;
        if (end > offset) {
          if (end === start) {
            chunk = chunk.slice(0, start - offset) + caretPlaceholder + chunk.slice(start - offset);
          } else {
            chunk =
              chunk.slice(0, end - offset) +
              selectionEndPlaceholder +
              (caret === end ? caretPlaceholder : "") +
              chunk.slice(end - offset);

            if (start >= offset) {
              chunk =
                chunk.slice(0, start - offset) +
                (caret === start ? caretPlaceholder : "") +
                selectionStartPlaceholder +
                chunk.slice(start - offset);
            } else {
              chunk = selectionStartPlaceholder + chunk;
            }
          }
        }

        chunk = formatOutput(chunk, whiteSpaces);

        if (end > correct.length) {
          chunk = chunk
            .replace(caretPlaceholder, caretHtml)
            .replace(selectionStartPlaceholder, selectionStartHtml)
            .replace(selectionEndPlaceholder, selectionEndHtml);
        }

        editingWrongTextRef.current.innerHTML = chunk;
      }

      if (editingRestTextRef.current) {
        editingRestTextRef.current.innerHTML = formatOutput(rest, whiteSpaces);
      }

      if (inputRef.current) {
        // inputRef.current.setSelectionRange(start, end, "forward");
        // if (caret !== -1) {
        //   const caretSpan = document.createElement("span");
        //   caretSpan.className = "caret";
        //   caretSpan.textContent = "|";
        //   inputRef.current.parentElement?.appendChild(caretSpan);
        // }
      }
    }
  );

  useLayoutEffect(() => {
    completedChunksRef.current = "";
    ongoingChunkRef.current = text.match(/^\S+\s+/)?.[0] || "";

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.disabled = ongoingChunkRef.current === "";
    }

    if (completedTextRef.current) {
      completedTextRef.current.textContent = "";
    }

    renderEditingText({
      correct: "",
      wrong: "",
      rest: ongoingChunkRef.current,
      start: 0,
      end: 0,
      caret: 0,
    });

    if (restTextRef.current) {
      restTextRef.current.innerHTML = formatOutput(text.slice(ongoingChunkRef.current.length), whiteSpaces);
    }
  }, [text, whiteSpaces, renderEditingText]); // whiteSpaces should not be here, on/off should be possible during the play without resetting the state

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
  }));

  const handleKeydown = useRefCallback((event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Set textarea value to: text before caret + tab + text after caret
      textarea.value = textarea.value.substring(0, start) + "\t" + textarea.value.substring(end);

      // Put caret at right position again
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    }
  });

  const handleSelectChange = useRefCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const { value, selectionStart: start, selectionEnd: end, selectionDirection } = input;
    const caret = selectionDirection === "forward" ? end : start;

    if (value !== ongoingChunkRef.current) {
      const correct = findMatchingPart(ongoingChunkRef.current ?? "", value);

      const newValue = completedChunksRef.current + correct;
      if (newValue !== lastServedInputRef.current) {
        lastServedInputRef.current = newValue;
        onInput?.(lastServedInputRef.current);
      }

      const wrong = value.slice(correct.length);

      if (wrong.length > 0) {
        const index = completedChunksRef.current.length + correct.length;
        const original = ongoingChunkRef.current;
        lastServedMistakeRef.current = { index, original, correct, wrong };
        onMistake?.(lastServedMistakeRef.current);
      } else if (lastServedMistakeRef.current) {
        lastServedMistakeRef.current = null;
        onMistake?.(null);
      }

      const rest = ongoingChunkRef.current.slice(correct.length);

      renderEditingText({ correct, wrong, rest, start, end, caret });

      return;
    }

    input.value = "";

    completedChunksRef.current = completedChunksRef.current + ongoingChunkRef.current;

    lastServedInputRef.current = completedChunksRef.current;
    onInput?.(lastServedInputRef.current);

    if (completedTextRef.current) {
      completedTextRef.current.innerHTML = formatOutput(completedChunksRef.current, whiteSpaces);
    }

    ongoingChunkRef.current = text.slice(completedChunksRef.current.length).match(/^\S+(\s+|$)/)?.[0] || "";

    if (ongoingChunkRef.current === "") {
      input.disabled = true;
    }

    if (restTextRef.current) {
      restTextRef.current.innerHTML = formatOutput(
        text.slice(completedChunksRef.current.length + ongoingChunkRef.current.length),
        whiteSpaces
      );
    }

    renderEditingText({
      correct: "",
      wrong: "",
      rest: ongoingChunkRef.current,
      start: 0,
      end: 0,
      caret: 0,
    });
  });

  return (
    <SComposer className={className}>
      <SComposerInput
        ref={inputRef}
        onKeyDown={handleKeydown}
        onSelect={handleSelectChange} // Select will handle input updates to prevent doing same work twice
        autoComplete="off"
        spellCheck="false"
      />
      <SComposerText>
        <span className="correct" ref={completedTextRef} />
        <span className="editing">
          <span className="correct" ref={editingCorrectTextRef} />
          <span className="wrong" ref={editingWrongTextRef} />
          <span ref={editingRestTextRef} />
        </span>
        <span ref={restTextRef} />
      </SComposerText>
    </SComposer>
  );
});

export default Composer;

const caretPlaceholder = "┃";
const selectionStartPlaceholder = "└";
const selectionEndPlaceholder = "┘";

const caretHtml = '<span class="caret"></span>';
const selectionStartHtml = '<span class="selection">';
const selectionEndHtml = "</span>";

function formatOutput(text: string, enableWhiteSpaces = true): string {
  // This is a faster version of the function that does not allow to style chars separately (needed to underscore them only without white spaces)
  // return text
  //   .replace(/</g, "&lt;")
  //   .replace(/ /g, '<span class="space"> </span>')
  //   .replace(/\t/g, '<span class="tab">\t</span>')
  //   .replace(/\n/g, '<span class="line-break">\n</span>');

  return Array.from(text)
    .map((symbol) => {
      if (symbol === caretPlaceholder || symbol === selectionStartPlaceholder || symbol == selectionEndPlaceholder) {
        return symbol;
      }
      if (symbol === " ") return enableWhiteSpaces ? '<span class="space"> </span>' : symbol;
      if (symbol === "\t") return enableWhiteSpaces ? '<span class="tab">\t</span>' : symbol;
      if (symbol === "\n") return enableWhiteSpaces ? '<span class="line-break">\n</span>' : symbol;
      return `<span class="char">${symbol}</span>`;
    })
    .join("");
}

function findMatchingPart(text: string, input: string): string {
  if (text.length === 0 || input.length === 0) return "";
  if (text[0] === input[0]) return text[0] + findMatchingPart(text.slice(1), input.slice(1));
  return "";
}

const caretBlinkKeyframes = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const SComposerText = styled.div`
  tab-size: 2;

  .editing .char {
    border-bottom: 3px solid currentColor;
    text-shadow: 0 1px 1px ${(p) => p.theme.color.composerEditingTextShadow};
  }

  .correct {
    color: ${(p) => p.theme.color.composerCorrectText};
  }

  .wrong {
    color: ${(p) => p.theme.color.composerWrongText};
    background-color: ${(p) => p.theme.color.composerWrongBackground};
  }

  .selection {
    background-color: ${(p) => p.theme.color.composerSelectionText};
  }

  .space,
  .tab,
  .line-break {
    opacity: 0.5;
  }

  .space {
    background: radial-gradient(circle at center, currentColor 0%, currentColor 100%);
    background-size: 3px 3px;
    background-position: center;
    background-repeat: no-repeat;
  }

  .tab {
    &::before {
      content: "→";
    }
  }

  .line-break::before {
    content: "↵";
  }

  .caret {
    margin-right: -3px;
    border-left: 3px solid currentColor;
    animation: ${caretBlinkKeyframes} 1s infinite;
  }
`;

const SComposerInput = styled.textarea`
  font-size: 10px;
  background: transparent;
  caret-color: transparent;
  color: transparent;
  resize: none;
  &::selection {
    background-color: transparent;
  }

  border: 2px solid ${(p) => p.theme.color.composerBorder};
  border-radius: inherit;

  transition: border-color 0.1s;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.color.composerFocusBorder};
  }
`;

const SComposer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2em;
  border-radius: 20px;
  background-color: ${(p) => p.theme.color.composerBackground};
  color: ${(p) => p.theme.color.composerText};
  font-size: 30px;
  text-align: left;
  white-space: break-spaces;

  position: relative;
  ${SComposerInput} {
    position: absolute;
    inset: 0;
  }

  &:not(:focus-within) {
    .caret {
      display: none;
    }
  }
`;

export type TComposerMistake = {
  original: string;
  correct: string;
  wrong: string;
  index: number;
};

type TComposerProps = {
  className?: string;
  text: string;
  whiteSpaces?: boolean;
  onInput?: (text: string) => void;
  onMistake?: (mistake: TComposerMistake | null) => void;
};

export type TComposerRef = {
  focus(): void;
};
