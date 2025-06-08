import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export function TextInputFixPlugin() {
  const [editor] = useLexicalComposerContext();

  // Simple focus on mount
  useEffect(() => {
    // Short delay to ensure the editor is fully initialized
    const timer = setTimeout(() => {
      editor.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [editor]);

  return null;
}