import StylesProvider from "./StylesProvider";
import Routes from "./Routes";
import UserProvider from "../data/UserProvider";

export default function App() {
  return (
    <StylesProvider>
      <UserProvider>
        <Routes />
      </UserProvider>
    </StylesProvider>
  );
}
