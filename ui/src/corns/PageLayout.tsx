import styled from "styled-components";

export default function PageLayout(props: TPageLayoutProps) {
  return (
    <SPageLayout className={props.className}>
      <h1>{props.title}</h1>
      {props.children}
    </SPageLayout>
  );
}

const SPageLayout = styled.div`
  box-sizing: border-box;
  min-height: 100%;
  min-width: 100%;
  padding: 10vh 10vw;
  text-align: center;
`;

type TPageLayoutProps = {
  className?: string;
  children: React.ReactNode;
  title: string;
};
