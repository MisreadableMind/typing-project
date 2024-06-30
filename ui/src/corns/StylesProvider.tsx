import { ThemeProvider } from "styled-components";
import createSchemeStyleSheet from "../tools/createSchemeStyleSheet";
import GlobalStyleSheet from "./GlobalStyleSheet";

export default function StylesProvider(props: TStylesProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyleSheet />
      <ColorStyleSheet />
      {props.children}
    </ThemeProvider>
  );
}

const [color, ColorStyleSheet] = createSchemeStyleSheet(
  {
    pageText: ["#242424", "#fff"],
    pageBackground: ["#edebe2", "#242424"],
    linkText: "#646cff",
    linkHoverText: "#535bf2",
    composerCaret: ["#242424", "#fff"],
    composerText: ["#848484", "#aaa"],
    composerCorrectText: ["#242424", "#fff"],
    composerWrongText: "#820303",
    composerWrongBackground: "#f0a3a3",
    composerEditingTextShadow: ["#fff", "#000"],
    composerSelectionText: ["#add8e6", "#637ea3"],
    composerBackground: ["#f5f5f5", "#333"],
    composerBorder: ["#e0e0e0", "#444"],
    composerFocusBorder: ["#646cff", "#535bf2"],
    buttonText: ["#242424", "#fff"],
    buttonSelectedText: "#fff",
    buttonBackground: ["#f5f5f5", "#333"],
    buttonSelectedBackground: ["#646cff", "#535bf2"],
    buttonBorder: ["#e0e0e0", "#444"],
  },
  "color"
);

const theme = {
  color,
} as const;

type TStylesProviderProps = {
  children: React.ReactNode;
};
