import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
import { useState, useCallback, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Undo, 
  Redo,
  Image,
  PlayCircle
} from 'lucide-react';

export function ToolbarPlugin({ onImageClick, onVideoClick, toolbarClassName }: { onImageClick?: () => void, onVideoClick?: () => void, toolbarClassName?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <div className={`toolbar${toolbarClassName ? ` ${toolbarClassName}` : ''}`}>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Undo"
      >
        <Undo className="format-icon" />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Redo"
      >
        <Redo className="format-icon" />
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={`toolbar-item ${isBold ? 'active' : ''}`}
        aria-label="Format Bold"
      >
        <Bold className="format-icon" />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={`toolbar-item ${isItalic ? 'active' : ''}`}
        aria-label="Format Italic"
      >
        <Italic className="format-icon" />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={`toolbar-item ${isUnderline ? 'active' : ''}`}
        aria-label="Format Underline"
      >
        <Underline className="format-icon" />
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        onClick={() => formatHeading('h1')}
        className="toolbar-item"
        aria-label="Format H1"
      >
        <Heading1 className="format-icon" />
      </button>
      <button
        type="button"
        onClick={() => formatHeading('h2')}
        className="toolbar-item"
        aria-label="Format H2"
      >
        <Heading2 className="format-icon" />
      </button>
      <button
        type="button"
        onClick={formatParagraph}
        className="toolbar-item"
        aria-label="Format Paragraph"
      >
        <span className="text-icon">¶</span>
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Bullet List"
      >
        <List className="format-icon" />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Numbered List"
      >
        <ListOrdered className="format-icon" />
      </button>
      {onImageClick && (
        <>
          <div className="toolbar-divider" />
          <button
            type="button"
            onClick={() => {
              console.log('ToolbarPlugin: Image button clicked', typeof onImageClick);
              if (onImageClick) onImageClick();
            }}
            className="toolbar-item"
            aria-label="Insert Image"
          >
            <Image className="format-icon" />
          </button>
        </>
      )}
      {onVideoClick && (
        <>
          <button
            type="button"
            onClick={() => {
              if (onVideoClick) onVideoClick();
            }}
            className="toolbar-item"
            aria-label="Insert Video"
          >
            <PlayCircle className="format-icon" />
          </button>
        </>
      )}
    </div>
  );
}
