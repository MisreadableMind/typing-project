export default function Composer(props: TComposerProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    props.onChange?.(event.target.value);
  };
  return <textarea className={props.className} value={props.value} onChange={handleChange} />;
}

type TComposerProps = {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
};
