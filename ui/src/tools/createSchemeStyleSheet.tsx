import { createGlobalStyle } from "styled-components";

/**
 * Creates stylesheet with system dependant styles and the list of corresponding CSS variable names
 */
export default function createSchemeStyleSheet<T extends TScheme>(
  scheme: T,
  prefix: string
): TCreateSchemeStyleSheetResult<T> {
  const variables = Object.keys(scheme).reduce<TSchemeVariables<T>>(
    (variables, name) => Object.assign(variables, { [name]: `var(${createVariableName(name as string, prefix)})` }),
    {} as TSchemeVariables<T>
  );

  const lightThemeVariablesSheet = Object.entries(scheme)
    .map(([name, value]) => `${createVariableName(name, prefix)}: ${Array.isArray(value) ? value[0] : value};`)
    .join("");

  const darkThemeVariablesSheet = Object.entries(scheme)
    .filter((property) => Array.isArray(property[1]))
    .map(([name, value]) => `${createVariableName(name, prefix)}: ${value[1]};`)
    .join("");

  const StyleSheet = createGlobalStyle`
    body {
      ${lightThemeVariablesSheet}
    }

    body[data-theme=auto] {
        @media screen and (prefers-color-scheme: dark) {
            ${darkThemeVariablesSheet}
        }
    }

    body[data-theme=light] {
      ${lightThemeVariablesSheet}
    }

    @media screen {
        body[data-theme=dark] {
          ${darkThemeVariablesSheet}
        }
    }`;

  return [variables, StyleSheet];
}

function createVariableName(colorName: string, prefix: string) {
  return `--${prefix}-${colorName}`;
}

type TThemedVariable = string | [light: string, dark: string];

type TScheme = {
  [name: string]: TThemedVariable;
};

type TSchemeVariables<T extends TScheme> = Record<keyof T, string>;

type TVariableSchemeStyleSheet = ReturnType<typeof createGlobalStyle>;

type TCreateSchemeStyleSheetResult<T extends TScheme> = [TSchemeVariables<T>, TVariableSchemeStyleSheet];
