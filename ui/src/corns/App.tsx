import Composer from "./Composer";
import GlobalStyleSheet from "./GlobalStyleSheet";
import PageLayout from "./PageLayout";
import StylesProvider from "./StylesProvider";

export default function App() {
  return (
    <StylesProvider>
      <GlobalStyleSheet />
      <PageLayout title="Typing Project">
        <Composer
          value="The sun was shining brightly on a beautiful summer day. Anna decided to go for a walk in the park. She saw many colorful flowers and heard birds singing happily. As she walked, she met her friend Tom, who was playing with his dog. They decided to sit on a bench and talk about their plans for the weekend. They both agreed to go on a picnic by the lake, bringing their favorite snacks and games. It was a perfect plan for a sunny day."
          onText={(text) => console.log({ text })}
          onMistake={(chunk) => console.warn({ chunk })}
        />
      </PageLayout>
    </StylesProvider>
  );
}
