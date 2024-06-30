import styled from "styled-components";

export default function Progress(props: TProgressProps) {
  const { className, total, correct, hasMistakes } = props;
  return (
    <SProgress
      className={className}
      children={<SProgressBar $width={100 / (total / correct)} $hasMistakes={hasMistakes} />}
    />
  );
}

const SProgressBar = styled.div<{ $width: number; $hasMistakes?: boolean }>`
  border-radius: inherit;
  height: 100%;
  min-width: 0%;
  max-width: 100%;
  padding: 0 8px;

  transition: width 0.1s ease, background-color ${(p) => (p.$hasMistakes ? "0.4s" : "0.1s")} ease;
  width: calc((100% - 16px) * ${(p) => (p.$width / 100).toFixed(2)});
  background-color: ${(p) => (p.$hasMistakes ? p.theme.color.progressBarWithMistakes : p.theme.color.progressBar)};
`;

const SProgress = styled.div`
  box-sizing: border-box;
  background-color: ${(p) => p.theme.color.progressBackground};
  border: 1px solid ${(p) => p.theme.color.progressBorder};
  padding: 3px;
  height: 24px;
  min-height: 24px;
  min-width: 24px;
  border-radius: 12px;
`;

type TProgressProps = {
  className?: string;
  total: number;
  correct: number;
  hasMistakes?: boolean;
};
