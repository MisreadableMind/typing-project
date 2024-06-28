import { useMemo, useReducer } from "react";
import styled, { keyframes } from "styled-components";
import useRefCallback from "use-ref-callback";

export default function Composer(props: TComposerProps) {
  const { value } = props;

  const [state, dispatch] = useReducer<(state: TComposerState, action: TComposerAction) => TComposerState>(
    (state, action) => {
      switch (action.type) {
        case "ADD_CORRECT_SYMBOL":
          props.onText?.(value.slice(0, state.correctSymbols + 1));
          return { ...state, correctSymbols: state.correctSymbols + 1 };
        case "ADD_WRONG_SYMBOL":
          props.onMistake?.(getMistakeChunk(value, state.correctSymbols));
          return { ...state, wrongSymbols: state.wrongSymbols + 1 };
        case "REMOVE_SYMBOL":
          if (state.wrongSymbols > 0) return { ...state, wrongSymbols: state.wrongSymbols - 1 };
          if (state.correctSymbols > 0) {
            props.onText?.(value.slice(0, state.correctSymbols - 1));
            return { ...state, correctSymbols: state.correctSymbols - 1 };
          }
          return state;
        default:
          return state;
      }
    },
    { correctSymbols: 0, wrongSymbols: 0 }
  );

  const [correct, wrong, rest] = useMemo((): [correct: string, wrong: string, rest: string] => {
    return [
      value.slice(0, state.correctSymbols),
      value.slice(state.correctSymbols, state.correctSymbols + state.wrongSymbols),
      value.slice(state.correctSymbols + state.wrongSymbols),
    ];
  }, [state, value]);

  const handleKeyDown = useRefCallback((e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      dispatch({ type: "REMOVE_SYMBOL" });
    } else if (e.key.length === 1) {
      e.preventDefault();
      if (value[state.correctSymbols + state.wrongSymbols] === e.key) {
        dispatch({ type: "ADD_CORRECT_SYMBOL" });
      } else {
        dispatch({ type: "ADD_WRONG_SYMBOL" });
      }
    }
  });

  return (
    <SComposerText className={props.className} tabIndex={0} onKeyDown={handleKeyDown}>
      <SComposerCorrectText children={correct} />
      <SComposerWrongText children={wrong} />
      <SComposerRestText $hasError={wrong.length > 0} children={rest} />
    </SComposerText>
  );
}

function getMistakeChunk(value: string, correctSymbols: number): string {
  const correctSequence = value.slice(0, correctSymbols);
  const lastSpaceIndex = correctSequence.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    return correctSequence.slice(lastSpaceIndex, lastSpaceIndex + correctSequence.indexOf(" "));
  }

  const chunkWithRestText = value.slice(lastSpaceIndex + 1);
  return chunkWithRestText.slice(0, chunkWithRestText.indexOf(" "));
}

const cursorBlinkKeyframes = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const SComposerRestText = styled.span<{ $hasError: boolean }>`
  &::before {
    content: "";
    display: inline-block;
    margin-left: -1px;
    height: 1.1em;
    width: 1px;
    vertical-align: text-bottom;
    background: ${(p) => (p.$hasError ? p.theme.color.composerWrongText : p.theme.color.composerCorrectText)};
    animation: ${cursorBlinkKeyframes} 1s infinite;
  }
`;

const SComposerWrongText = styled.span`
  color: ${(p) => p.theme.color.composerWrongText};
`;

const SComposerCorrectText = styled.span`
  color: ${(p) => p.theme.color.composerCorrectText};
`;

const SComposerText = styled.div`
  padding: 2em;
  border: 2px solid ${(p) => p.theme.color.composerBorder};
  border-radius: 20px;
  background-color: ${(p) => p.theme.color.composerBackground};
  color: ${(p) => p.theme.color.composerText};
  font-size: 20px;
  text-align: left;
  font-weight: bold;

  transition: border-color 0.1s;

  &:focus {
    border-color: ${(p) => p.theme.color.composerFocusBorder};
  }

  &:not(:focus) ${SComposerRestText}::before {
    display: none;
  }
`;

type TComposerState = {
  correctSymbols: number;
  wrongSymbols: number;
};

type TComposerAction = { type: "ADD_CORRECT_SYMBOL" } | { type: "ADD_WRONG_SYMBOL" } | { type: "REMOVE_SYMBOL" };

type TComposerProps = {
  className?: string;
  value: string;
  onText?: (value: string) => void;
  onMistake?: (chunk: string) => void;
};
