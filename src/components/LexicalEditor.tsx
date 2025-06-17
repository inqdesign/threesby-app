import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ToolbarPlugin } from './editor/ToolbarPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ImageNode, INSERT_IMAGE_COMMAND, ImagePayload, $createImageNode } from './editor/ImageNode';
import { VideoNode, INSERT_VIDEO_COMMAND as INSERT_VIDEO_COMMAND_VIDEO, VideoPayload, $createVideoNode } from './editor/VideoNode';
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode, 
  $getSelection,
  EditorState
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import type { LexicalEditor as LexicalEditorType } from 'lexical';
import { TextInputFixPlugin } from './editor/TextInputFixPlugin';
import './LexicalEditor.css';

// Define the editor theme
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    code: 'editor-text-code',
  },
};

// Define the nodes we want to use
const nodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  ImageNode,
  VideoNode,
];

// Create a plugin to handle placeholder text
function PlaceholderPlugin({ placeholder }: { placeholder: string }) {
  return <div className="editor-placeholder">{placeholder}</div>;
}

// Enhanced plugin to handle initial JSON content
function InitialContentPlugin({ initialContent }: { initialContent: string }) {
  const [editor] = useLexicalComposerContext();
  const hasInitializedRef = React.useRef<boolean>(false);

  useEffect(() => {
    if (hasInitializedRef.current || !initialContent) {
      return;
    }
    
    // Set initialized flag to prevent multiple initializations
    hasInitializedRef.current = true;
    
    // Use setTimeout to move the state update out of React's rendering phase
    setTimeout(() => {
      try {
        const json = initialContent && initialContent.trim() ? JSON.parse(initialContent) : null;
        if (json) {
          editor.setEditorState(editor.parseEditorState(JSON.stringify(json)));
        } else {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          });
        }
      } catch (error) {
        console.error('Error parsing initial JSON content:', error);
        // fallback to empty doc
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        });
      }
    }, 0)
  }, [editor, initialContent]);
  return null;
}

// Plugin to handle image insertion commands
function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) {
      return;
    }

    // Register the command handler for image insertion
    const removeListener = editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        console.log('INSERT_IMAGE_COMMAND received with payload:', payload);
        const { src, altText, width, height, showCaption } = payload;
        
        if (!src) {
          console.error('Image source is empty or undefined');
          return false;
        }

        try {
          // Focus the editor first to ensure we have a valid selection
          editor.focus();
          
          // Use update to modify the editor state
          editor.update(() => {
            try {
              // Create the image node with the provided properties
              const imageNode = $createImageNode({
                src,
                altText: altText || 'Image',
                width: width || 'auto',
                height: height || 'auto',
                showCaption: showCaption || false,
              });
              
              // Get the current selection
              const selection = $getSelection();
              
              if (selection) {
                // If we have a selection, insert at that position
                console.log('Inserting image at selection');
                selection.insertNodes([imageNode]);
              } else {
                // Otherwise, append to the end of the document
                console.log('No selection, appending to end of document');
                const root = $getRoot();
                
                // Create a paragraph if the document is empty
                if (root.getChildrenSize() === 0) {
                  const paragraph = $createParagraphNode();
                  root.append(paragraph);
                }
                
                // Get the last child and insert after it
                const lastChild = root.getLastChild();
                if (lastChild) {
                  lastChild.insertAfter(imageNode);
                } else {
                  // Fallback: append directly to root
                  root.append(imageNode);
                }
              }
              
              console.log('Image node inserted successfully');
            } catch (innerError) {
              console.error('Error inserting image node:', innerError);
            }
          });
          
          // Force a re-render of the editor
          setTimeout(() => {
            editor.update(() => {
              const root = $getRoot();
              const firstChild = root.getFirstChild();
              if (firstChild) {
                firstChild.markDirty();
              }
            });
          }, 0);
          
          return true;
        } catch (error) {
          console.error('Error handling image insertion command:', error);
          return false;
        }
      },
      0 // Priority 0 (highest)
    );

    return removeListener;
  }, [editor]);

  return null;
}

// Plugin to handle video insertion commands
function VideoPlugin() {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    if (!editor) return;
    const removeListener = editor.registerCommand<VideoPayload>(
      INSERT_VIDEO_COMMAND_VIDEO,
      (payload) => {
        const { src, altText, width, height, showCaption } = payload;
        if (!src) return false;
        try {
          editor.focus();
          editor.update(() => {
            const videoNode = $createVideoNode({ src, altText, width, height, showCaption });
            const selection = $getSelection();
            if (selection) {
              selection.insertNodes([videoNode]);
            } else {
              const root = $getRoot();
              if (root.getChildrenSize() === 0) {
                const paragraph = $createParagraphNode();
                root.append(paragraph);
              }
              const lastChild = root.getLastChild();
              if (lastChild) {
                lastChild.insertAfter(videoNode);
              } else {
                root.append(videoNode);
              }
            }
          });
          return true;
        } catch (e) {
          console.error('Error inserting video node:', e);
          return false;
        }
      },
      0
    );
    return removeListener;
  }, [editor]);
  return null;
}

// Plugin to handle content changes and JSON generation
function ContentChangePlugin({ onChange }: { onChange: (value: string) => void }) {
  const [editor] = useLexicalComposerContext();
  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        const json = editorState.toJSON();
        onChange(JSON.stringify(json));
      }}
    />
  );
}

// Define the props for the LexicalEditor component
interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onImageUpload?: () => void;
  onVideoUpload?: () => void;
}

// Define the methods we want to expose via the ref
export interface LexicalEditorRefMethods {
  focus: () => void;
  clear: () => void;
  getEditor: () => LexicalEditorType | null;
  insertImage: (url: string) => void;
}

// Create the LexicalEditor component
const LexicalEditor = forwardRef<LexicalEditorRefMethods, LexicalEditorProps>(
  ({ value, onChange, placeholder = 'Enter some text...', className = '', autoFocus = true, onImageUpload, onVideoUpload }, ref) => {
    const [editor, setEditor] = useState<LexicalEditorType | null>(null);
    
    // Store the image upload handler for use in the toolbar
    const imageUploadHandler = useCallback(() => {
      if (onImageUpload) {
        onImageUpload();
      }
    }, [onImageUpload]);

    // Store the video upload handler for use in the toolbar
    const videoUploadHandler = useCallback(() => {
      if (onVideoUpload) {
        onVideoUpload();
      }
    }, [onVideoUpload]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.focus();
      },
      clear: () => {
        editor?.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        });
      },
      getEditor: () => {
        return editor;
      },
      insertImage: (url: string) => {
        console.log('Inserting image with URL:', url);
        if (editor) {
          editor.focus();
          try {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { 
              src: url, 
              altText: 'Image',
              width: 'auto',
              height: 'auto',
              showCaption: false
            });
            console.log('Image insertion command dispatched successfully');
          } catch (error) {
            console.error('Error inserting image:', error);
          }
        } else {
          console.error('Editor not initialized for image insertion');
        }
      }
    }));

    // Create a plugin to handle editor initialization
    const EditorInitializePlugin = () => {
      const [editor] = useLexicalComposerContext();
      
      useEffect(() => {
        console.log('Editor initialized');
        setEditor(editor);
      }, [editor]);
      
      return null;
    };

    // Define the editor configuration
    const initialConfig = {
      namespace: 'ThreesbyEditor',
      theme,
      nodes,
      onError: (error: Error) => {
        console.error('Lexical Editor Error:', error);
      },
      editorState: null, // We'll set content via the InitialContentPlugin
      editable: true,
    };

    return (
      <div className={`lexical-editor-container rounded-md ${className}`}>
        <LexicalComposer 
          initialConfig={initialConfig}
        >
          <div className="editor-inner">
            <div className="p-1">
              <ToolbarPlugin onImageClick={imageUploadHandler} onVideoClick={videoUploadHandler} toolbarClassName="rounded-md" />
            </div>
            <div className="editor-content rounded-md p-2">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    className="editor-input" 
                    ariaLabel="Rich Text Editor"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    style={{
                      minHeight: '150px',
                      outline: 'none',
                      padding: '8px',
                      position: 'relative',
                      tabSize: 1,
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      userSelect: 'text'
                    }}
                  />
                }
                placeholder={<PlaceholderPlugin placeholder={placeholder} />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <InitialContentPlugin initialContent={value} />
              <ContentChangePlugin onChange={onChange} />
              <ImagePlugin />
              <VideoPlugin />
              {autoFocus && <AutoFocusPlugin defaultSelection="rootStart" />}
              <HistoryPlugin />
              <LinkPlugin />
              <ListPlugin />
              <TextInputFixPlugin />
              <EditorInitializePlugin />
            </div>
          </div>
        </LexicalComposer>
      </div>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';

// Add a static method to convert Lexical JSON to HTML
(LexicalEditor as any).jsonToHtml = function(json: string): string {
  try {
    // Parse the JSON to check if it's valid Lexical format
    const parsedJson = JSON.parse(json);
    

    
    // Enhanced conversion: handle different node types including images
    if (parsedJson && parsedJson.root && parsedJson.root.children) {
      const convertNode = (node: any): string => {
        switch (node.type) {
          case 'text':
            let text = node.text || '';
            // Apply text formatting
            if (node.format) {
              if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
              if (node.format & 2) text = `<em>${text}</em>`; // Italic
              if (node.format & 8) text = `<u>${text}</u>`; // Underline
              if (node.format & 4) text = `<s>${text}</s>`; // Strikethrough
              if (node.format & 16) text = `<code>${text}</code>`; // Code
            }
            return text;
            
          case 'paragraph':
            const paragraphContent = node.children ? node.children.map(convertNode).join('') : '';
            return paragraphContent ? `<p>${paragraphContent}</p>` : '<p><br></p>';
            
          case 'heading':
            const headingContent = node.children ? node.children.map(convertNode).join('') : '';
            const level = node.tag || 'h1';
            return `<${level}>${headingContent}</${level}>`;
            
          case 'list':
            const listItems = node.children ? node.children.map(convertNode).join('') : '';
            const listTag = node.listType === 'number' ? 'ol' : 'ul';
            return `<${listTag}>${listItems}</${listTag}>`;
            
          case 'listitem':
            const itemContent = node.children ? node.children.map(convertNode).join('') : '';
            return `<li>${itemContent}</li>`;
            
          case 'image':
            const src = node.src || '';
            const alt = node.altText || 'Image';
            const width = node.width ? ` width="${node.width}"` : '';
            const height = node.height ? ` height="${node.height}"` : '';
            return `<img src="${src}" alt="${alt}"${width}${height} style="max-width: 100%; height: auto; margin: 1rem 0 2rem;" />`;
            
          case 'video':
            const videoSrc = node.src || '';
            return `<video controls style="max-width: 100%; height: auto; margin: 1rem 0 2rem;"><source src="${videoSrc}" type="video/mp4">Your browser does not support the video tag.</video>`;
            
          case 'link':
            const href = node.url || '';
            const linkContent = node.children ? node.children.map(convertNode).join('') : '';
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${linkContent}</a>`;
            
          case 'linebreak':
            return '<br>';
            
          default:
            // For unknown node types, try to process children
            if (node.children && Array.isArray(node.children)) {
              return node.children.map(convertNode).join('');
            }
            return '';
        }
      };
      
      return parsedJson.root.children.map(convertNode).join('');
    }
    
    // If not a valid Lexical structure, return empty
    return '';
  } catch (e) {
    console.error('Failed to convert Lexical JSON to HTML', e);
    // If JSON parsing fails, treat as plain text
    return `<p>${json}</p>`;
  }
};

export default LexicalEditor;