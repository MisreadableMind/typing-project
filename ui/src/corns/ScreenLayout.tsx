import { useEffect, useState } from "react";
import styled from "styled-components";
import { useUserContext } from "../data/UserProvider";
import window from "../tools/window";

export default function ScreenLayout(props: TScreenLayoutProps) {
  const userContext = useUserContext();

  const [floating, setFloating] = useState(() => window.scrollY > 0);
  useEffect(() => {
    const listener = () => setFloating(window.scrollY > 0);
    window.addEventListener("scroll", listener);
    return () => window.removeEventListener("scroll", listener);
  }, []);

  return (
    <SScreenLayout className={props.className}>
      <SHeader $floating={floating}>
        <SHeaderTitle children="TapTapTap.me" />
        {userContext.user && (
          <SHeaderUserSection>
            <span>
              Hello <strong children={userContext.user.username} />!
            </span>
            <SHeaderButton children="Logout" onClick={userContext.logout} />
          </SHeaderUserSection>
        )}
      </SHeader>
      <SMain children={props.children} />
    </SScreenLayout>
  );
}

// #region Styles

const SMain = styled.main`
  box-sizing: border-box;
  min-height: 100%;
  min-width: 100%;
  padding: 10vh 10vw;
  text-align: center;
  overflow: auto;
  margin-top: 80px; // For SHeader
`;

const SHeaderButton = styled.button.attrs({ type: "button" })`
  display: inline;
  color: ${(p) => p.theme.color.linkText};
  background: none;
  border: none;
  cursor: pointer;
`;

const SHeaderUserSection = styled.span`
  display: inline-flex;
  gap: 1em;
  align-items: center;
`;

const SHeaderTitle = styled.h1`
  margin: 0;
`;

const SHeader = styled.header<{ $floating: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(p) => p.theme.offset.page.vertical} ${(p) => p.theme.offset.page.horizontal};
  background: ${(p) => p.theme.color.pageBackground};

  transition: box-shadow 0.2s ease;
  box-shadow: ${(p) => (p.$floating ? "0 0 2px 0 " + p.theme.color.pageHeaderShadow : "0 0 0 0 transparent")};
`;

const SScreenLayout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  min-width: 100%;

  ${SHeader} {
    flex-shrink: 0;
  }

  ${SMain} {
    flex: 1;
  }
`;

// #endregion

// #region Types

type TScreenLayoutProps = {
  className?: string;
  children: React.ReactNode;
};

// #endregion
