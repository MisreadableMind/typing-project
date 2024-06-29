import React, { useImperativeHandle, useLayoutEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import useRefCallback from "use-ref-callback";

const Composer = React.forwardRef<TComposerRef, TComposerProps>(function Composer(props, ref) {
  const { className, text } = props;

  const inputRef = useRef<HTMLTextAreaElement>(null); // Editable part
  const ongoingChunkRef = useRef<string>(""); // Chunk that needs to be entered now
  const completedTextRef = useRef<HTMLSpanElement>(null); // Correct part that cannot be edited
  const editingCorrectTextRef = useRef<HTMLSpanElement>(null);
  const editingWrongTextRef = useRef<HTMLSpanElement>(null);
  const editingRestTextRef = useRef<HTMLSpanElement>(null);
  const restTextRef = useRef<HTMLSpanElement>(null); // Part of text that need to be entered after the ongoing chunk

  useLayoutEffect(() => {
    ongoingChunkRef.current = text.match(/^\S+\s+/)?.[0] || "";

    if (inputRef.current) {
      inputRef.current.value = "";
      if (ongoingChunkRef.current === "") {
        inputRef.current.disabled = true;
      }
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
      editingRestTextRef.current.textContent = ongoingChunkRef.current;
    }

    if (restTextRef.current) {
      restTextRef.current.textContent = text.slice(ongoingChunkRef.current.length);
    }
  }, [text]);

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
  }));

  const trackInput = useRefCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    if (input.value !== ongoingChunkRef.current) {
      // Display ongoing state
      const matched = findMatchingPart(ongoingChunkRef.current ?? "", input.value);
      if (editingCorrectTextRef.current) {
        editingCorrectTextRef.current.textContent = matched;
      }
      if (editingWrongTextRef.current) {
        editingWrongTextRef.current.textContent = input.value.slice(matched.length);
      }
      if (editingRestTextRef.current) {
        editingRestTextRef.current.textContent = ongoingChunkRef.current.slice(matched.length);
      }
      return;
    }

    input.value = "";

    const completed = completedTextRef.current;
    if (!completed) return;

    const completedText = (completed.textContent ?? "") + ongoingChunkRef.current;
    completed.textContent = completedText;

    ongoingChunkRef.current = text.slice(completedText.length).match(/^\S+(\s+|$)/)?.[0] || "";

    if (ongoingChunkRef.current === "") {
      input.disabled = true;
    }

    if (restTextRef.current) {
      restTextRef.current.textContent = text.slice(completedText.length + ongoingChunkRef.current.length);
    }

    if (editingCorrectTextRef.current) {
      editingCorrectTextRef.current.textContent = "";
    }

    if (editingWrongTextRef.current) {
      editingWrongTextRef.current.textContent = "";
    }

    if (editingRestTextRef.current) {
      editingRestTextRef.current.textContent = ongoingChunkRef.current;
    }
  });

  return (
    <SComposer className={className}>
      <SComposerInput ref={inputRef} onInput={trackInput} /*onSelect={trackInput}*/ />
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

function findMatchingPart(text: string, input: string): string {
  if (text.length === 0 || input.length === 0) return "";
  if (text[0] === input[0]) return text[0] + findMatchingPart(text.slice(1), input.slice(1));
  return "";
}

const cursorBlinkKeyframes = keyframes`
  0% {
    border-color: transparent;
  }
  50% {
    border-color: var(--color-composerCaret);
  }
  100% {
    border-color: transparent;
  }
`;

const SComposerRestText = styled.span`
  margin-left: -3px;
  border-left: 3px solid ${(p) => p.theme.color.composerCaret};
  animation: ${cursorBlinkKeyframes} 1s infinite;
`;

const SComposerText = styled.div`
  span {
    font-weight: 400;
    transition: font-weight 0.2s ease;
  }

  .editing span {
    font-weight: 600;
  }

  .correct {
    color: ${(p) => p.theme.color.composerCorrectText};
  }

  .wrong {
    color: ${(p) => p.theme.color.composerWrongText};
    background-color: ${(p) => p.theme.color.composerWrongBackground};
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
  onInput?: (text: string) => void;
  onMistake?: (chunk: string) => void;
};

export type TComposerRef = {
  focus(): void;
};
