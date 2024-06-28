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
        height: 100%;
        width: 100%;
    }

    body {
        font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
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
