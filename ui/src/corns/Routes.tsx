import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import LoginRoute from "./LoginRoute";
import ComposerRoute from "./ComposerRoute";
import { useUserContext } from "../data/UserProvider";

export default function Routes() {
  return <RouterProvider router={router} />;
}

const router = createBrowserRouter([
  { path: "/login", element: <ApplicationRoute pub children={<LoginRoute />} /> },
  { path: "/app", element: <ApplicationRoute children={<ComposerRoute />} /> },
  { path: "/", element: <ApplicationRoute children={<Navigate to="/app" />} /> },
  { path: "*", element: <Navigate to="/" /> },
]);

function ApplicationRoute(props: TApplicationRouteProps) {
  const { children, pub = false } = props;
  const { user } = useUserContext();
  if (pub == !user) return children;
  return <Navigate to={user ? "/" : "/login"} />;
}

type TApplicationRouteProps = {
  children: React.ReactNode;
  pub?: boolean;
};
