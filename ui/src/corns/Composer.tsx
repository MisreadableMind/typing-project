import React, { useImperativeHandle, useLayoutEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import useRefCallback from "use-ref-callback";

const Composer = React.forwardRef<TComposerRef, TComposerProps>(function Composer(props, ref) {
  const { className, text, whiteSpaces } = props;

  const inputRef = useRef<HTMLTextAreaElement>(null); // Editable part
  const completedChunksRef = useRef<string>(""); // Chunks that entered correctly
  const ongoingChunkRef = useRef<string>(""); // Chunk that needs to be entered now
  const completedTextRef = useRef<HTMLSpanElement>(null); // Correct part that cannot be edited
  const editingCorrectTextRef = useRef<HTMLSpanElement>(null);
  const editingWrongTextRef = useRef<HTMLSpanElement>(null);
  const editingRestTextRef = useRef<HTMLSpanElement>(null);
  const restTextRef = useRef<HTMLSpanElement>(null); // Part of text that need to be entered after the ongoing chunk

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

    if (editingCorrectTextRef.current) {
      editingCorrectTextRef.current.textContent = "";
    }

    if (editingWrongTextRef.current) {
      editingWrongTextRef.current.textContent = "";
    }

    if (editingRestTextRef.current) {
      editingRestTextRef.current.innerHTML = displayWhiteSpaces(ongoingChunkRef.current, whiteSpaces);
    }

    if (restTextRef.current) {
      restTextRef.current.innerHTML = displayWhiteSpaces(text.slice(ongoingChunkRef.current.length), whiteSpaces);
    }
  }, [text, whiteSpaces]); // whiteSpaces should not be here, on/off should be possible during the play without resetting the state

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
  }));

  const handleInputChange = useRefCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    if (input.value !== ongoingChunkRef.current) {
      // Display ongoing state
      const matched = findMatchingPart(ongoingChunkRef.current ?? "", input.value);
      if (editingCorrectTextRef.current) {
        editingCorrectTextRef.current.innerHTML = displayWhiteSpaces(matched, whiteSpaces);
      }
      if (editingWrongTextRef.current) {
        editingWrongTextRef.current.innerHTML = displayWhiteSpaces(input.value.slice(matched.length), whiteSpaces);
      }
      if (editingRestTextRef.current) {
        editingRestTextRef.current.innerHTML = displayWhiteSpaces(
          ongoingChunkRef.current.slice(matched.length),
          whiteSpaces
        );
      }
      return;
    }

    input.value = "";

    completedChunksRef.current = completedChunksRef.current + ongoingChunkRef.current;

    if (completedTextRef.current) {
      completedTextRef.current.innerHTML = displayWhiteSpaces(completedChunksRef.current, whiteSpaces);
    }

    ongoingChunkRef.current = text.slice(completedChunksRef.current.length).match(/^\S+(\s+|$)/)?.[0] || "";

    if (ongoingChunkRef.current === "") {
      input.disabled = true;
    }

    if (restTextRef.current) {
      restTextRef.current.innerHTML = displayWhiteSpaces(
        text.slice(completedChunksRef.current.length + ongoingChunkRef.current.length),
        whiteSpaces
      );
    }

    if (editingCorrectTextRef.current) {
      editingCorrectTextRef.current.textContent = "";
    }

    if (editingWrongTextRef.current) {
      editingWrongTextRef.current.textContent = "";
    }

    if (editingRestTextRef.current) {
      editingRestTextRef.current.innerHTML = displayWhiteSpaces(ongoingChunkRef.current, whiteSpaces);
    }
  });

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

      handleInputChange();
    }
  });

  return (
    <SComposer className={className}>
      <SComposerInput ref={inputRef} onInput={handleInputChange} onKeyDown={handleKeydown} /*onSelect={trackInput}*/ />
      <SComposerText>
        <span className="correct" ref={completedTextRef} />
        <span className="editing">
          <span className="correct" ref={editingCorrectTextRef} />
          <span className="wrong" ref={editingWrongTextRef} />
          <SComposerRestText ref={editingRestTextRef} />
        </span>
        <span ref={restTextRef} />
      </SComposerText>
    </SComposer>
  );
});

export default Composer;

function displayWhiteSpaces(text: string, enabled = true): string {
  if (!enabled) return text;

  return text
    .replace(/</g, "&lt;")
    .replace(/ /g, '<span class="space"> </span>')
    .replace(/\t/g, '<span class="tab">\t</span>')
    .replace(/\n/g, '<span class="line-break">⏎\n</span>');
}

function findMatchingPart(text: string, input: string): string {
  if (text.length === 0 || input.length === 0) return "";
  if (text[0] === input[0]) return text[0] + findMatchingPart(text.slice(1), input.slice(1));
  return "";
}

const cursorBlinkKeyframes = keyframes`
  0% {
    border-left-color: transparent;
  }
  50% {
    border-left-color: var(--color-composerCaret);
  }
  100% {
    border-left-color: transparent;
  }
`;

const SComposerRestText = styled.span`
  margin-left: -3px;
  border-left: 3px solid ${(p) => p.theme.color.composerCaret};
  animation: ${cursorBlinkKeyframes} 1s infinite;
`;

const SComposerText = styled.div`
  tab-size: 2;

  .editing span {
    border-bottom: 3px solid gray;
  }

  .correct {
    color: ${(p) => p.theme.color.composerCorrectText};
  }

  .wrong {
    color: ${(p) => p.theme.color.composerWrongText};
    background-color: ${(p) => p.theme.color.composerWrongBackground};
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

  .line-break {
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
  white-space: pre-wrap;

  position: relative;
  ${SComposerInput} {
    position: absolute;
    inset: 0;
  }
`;

type TComposerProps = {
  className?: string;
  text: string;
  whiteSpaces?: boolean;
  onInput?: (text: string) => void;
  onMistake?: (chunk: string) => void;
};

export type TComposerRef = {
  focus(): void;
};
