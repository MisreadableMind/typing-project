import { createGlobalStyle } from "styled-components";
import { Normalize } from "styled-normalize";

export default function GlobalStyleSheet() {
  return (
    <>
      <Normalize />
      <GlobalStyles />
    </>
  );
}

const GlobalStyles = createGlobalStyle`
    html, body, #root {
        min-height: 100%;
        min-width: 100%;
    }

    body {
        font-family: "Roboto Mono", "Roboto Mono", "Vazirmatn", monospace;
        line-height: 1.5;
        font-weight: 400;

        color-scheme: light dark;
        color: ${(p) => p.theme.color.pageText};
        background-color: ${(p) => p.theme.color.pageBackground};

        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    a {
        color: ${(p) => p.theme.color.linkText};
        text-decoration: inherit;
    }
    a:hover {
        color: ${(p) => p.theme.color.linkHoverText};
    }

`;
