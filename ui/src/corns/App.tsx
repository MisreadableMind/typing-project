import Composer from "./Composer";
import GlobalStyleSheet from "./GlobalStyleSheet";
import PageLayout from "./PageLayout";
import StylesProvider from "./StylesProvider";

export default function App() {
  return (
    <StylesProvider>
      <GlobalStyleSheet />
      <PageLayout title="Typing Project">
        <Composer value="Hello, World!" onChange={console.log} />
      </PageLayout>
    </StylesProvider>
  );
}
