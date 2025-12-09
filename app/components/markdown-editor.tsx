import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import React from 'react';
import { useTheme } from '~/context/theme';

type MarkdownEditorProps = {
  height?: number;
  onChange: (val: string) => void;
  value: string;
};

export function MarkdownEditor({ height = 300, onChange, value }: MarkdownEditorProps) {
  const [MDEditor, setMDEditor] = React.useState<any>(null);

  const { theme } = useTheme();

  React.useEffect(() => {
    import('@uiw/react-md-editor').then((mod) => setMDEditor(() => mod.default));
  }, []);

  if (!MDEditor) return null;

  return (
    <div className="w-full" data-color-mode={theme}>
      <MDEditor height={height} onChange={onChange} value={value} />
    </div>
  );
}
