import { ThemeProvider } from "styled-components";
import createSchemeStyleSheet from "../tools/createSchemeStyleSheet";

export default function StylesProvider(props: TStylesProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <ColorStyleSheet />
      {props.children}
    </ThemeProvider>
  );
}

const [color, ColorStyleSheet] = createSchemeStyleSheet(
  {
    pageText: ["#242424", "#fff"],
    pageBackground: ["#fff", "#242424"],
    linkText: "#646cff",
    linkHoverText: "#535bf2",
  },
  "color"
);

const theme = {
  color,
} as const;

type TStylesProviderProps = {
  children: React.ReactNode;
};
