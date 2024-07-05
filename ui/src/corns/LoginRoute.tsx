// import styled from "styled-components";
import styled from "styled-components";
import ScreenLayout from "./ScreenLayout";
import useRefCallback from "use-ref-callback";
import { useUserContext } from "../data/UserProvider";
import { Navigate } from "react-router-dom";
import useRequest from "use-request";

export default function LoginRoute() {
  const userContext = useUserContext();

  const loginRequest = useRequest(userContext.login);

  const handleSubmit = useRefCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string | null;
    const password = formData.get("password") as string | null;

    if (!username || username !== password) return alert("Password should match username");
    loginRequest.execute(username, password);
  });

  if (userContext.user) return <Navigate to="/" />;

  return (
    <ScreenLayout>
      <SForm onSubmit={handleSubmit}>
        <input name="username" type="text" placeholder="Username" autoFocus required disabled={loginRequest.pending} />
        <input name="password" type="password" placeholder="Password" required disabled={loginRequest.pending} />
        <button type="submit" disabled={loginRequest.pending} children="Login" />
      </SForm>
    </ScreenLayout>
  );
}

// #region Styles

const SForm = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 200px;
  margin: 0 auto;
  gap: 1em;

  button {
    align-self: center;
  }
`;

// #endregion
