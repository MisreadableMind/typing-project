import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Composer, { TComposerRef } from "./Composer";
import PageLayout from "./PageLayout";
import StylesProvider from "./StylesProvider";

export default function App() {
  const [selectedTextName, selectText] = useState(() => textsNames[0]);
  const composerRef = useRef<TComposerRef>(null);
  useEffect(() => composerRef.current?.focus(), [selectedTextName]);

  return (
    <StylesProvider>
      <PageLayout title="Typing Project">
        <SButtonsGroup>
          {textsNames.map((name) => (
            <SButton
              key={name}
              $selected={name === selectedTextName}
              children={name}
              onClick={() => selectText(name)}
            />
          ))}
        </SButtonsGroup>
        <Composer
          ref={composerRef}
          text={texts[selectedTextName]}
          onInput={(text) => console.log({ text })}
          onMistake={(chunk) => console.warn({ chunk })}
          whiteSpaces={selectedTextName === "Fibonacci"}
        />
      </PageLayout>
    </StylesProvider>
  );
}

const texts = {
  Paragraph:
    "The sun was shining brightly on a beautiful summer day. Anna decided to go for a walk in the park. She saw many colorful flowers and heard birds singing happily. As she walked, she met her friend Tom, who was playing with his dog. They decided to sit on a bench and talk about their plans for the weekend. They both agreed to go on a picnic by the lake, bringing their favorite snacks and games. It was a perfect plan for a sunny day.",
  Short: "Hello, Typing Project!",
  Fibonacci: `def fibonacci(n):
\tif n <= 0:
\t\treturn "Input should be a positive integer."
\telif n == 1:
\t\treturn 0
\telif n == 2:
\t\treturn 1
\telse:
\t\ta, b = 0, 1
\t\tfor _ in range(2, n):
\t\t\ta, b = b, a + b
\t\treturn b`,
} as const;

const textsNames = Object.keys(texts) as (keyof typeof texts)[];

const SButton = styled.button.attrs({ type: "button" })<{ $selected: boolean }>`
  white-space: nowrap;
  border-radius: 0;
  border: 1px solid ${(p) => p.theme.color.buttonBorder};
  color: ${(p) => (p.$selected ? p.theme.color.buttonSelectedText : p.theme.color.buttonText)};
  background-color: ${(p) => (p.$selected ? p.theme.color.buttonSelectedBackground : p.theme.color.buttonBackground)};
  padding: 0.5em 1em;
  cursor: pointer;

  &:first-child:not(:last-child) {
    border-right: 0;
  }

  &:first-child {
    border-top-left-radius: 0.5em;
    border-bottom-left-radius: 0.5em;
  }

  &:last-child {
    border-top-right-radius: 0.5em;
    border-bottom-right-radius: 0.5em;
  }
`;

const SButtonsGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1em;
`;
