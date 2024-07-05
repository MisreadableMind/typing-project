import { createContext, useContext, useMemo } from "react";
import useRefCallback from "use-ref-callback";
import useLocalStorage from "../tools/useLocalStorage";

const UserContext = createContext<TUserContext>({
  user: null,
  login: () => Promise.reject("Not ready"),
  logout: () => {},
});

export default function UserProvider({ children }: TUserProviderProps) {
  const [user, setUser] = useLocalStorage<TUser | null>("user", null);

  const login = useRefCallback(async (username: string, password: string) => {
    if (username !== password) {
      alert("Password must be the same as username");
      return null;
    }

    return await new Promise<TUser>((resolve) =>
      setTimeout(() => {
        const user = { username };
        setUser(user);
        resolve(user);
      }, 1000)
    );
  });

  const logout = useRefCallback(() => setUser(null));

  const context = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <UserContext.Provider value={context} children={children} />;
}

// #region Helpers

export function useUserContext(): TUserContext {
  return useContext(UserContext);
}

// #endregion

// #region Types

type TUser = {
  username: string;
};

type TUserContext = {
  user: TUser | null;
  login: (username: string, password: string) => Promise<TUser | null>;
  logout: () => void;
};

type TUserProviderProps = {
  children: React.ReactNode;
};

// #endregion
