import {
  $createNodeSelection,
  $setSelection,
  createCommand,
  DecoratorNode,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';

export type ImagePayload = {
  altText: string;
  height?: number | 'auto';
  maxWidth?: number;
  src: string;
  width?: number | 'auto';
  showCaption?: boolean;
  caption?: string;
  captionsEnabled?: boolean;
};

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number | 'auto';
    maxWidth?: number;
    src: string;
    width?: number | 'auto';
    showCaption?: boolean;
    caption?: string;
    type: 'image';
    version: 1;
  },
  SerializedLexicalNode
>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | 'auto';
  __height: number | 'auto';
  __maxWidth: number | undefined;
  __showCaption: boolean;
  __caption: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, src, showCaption, caption } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      src,
      width,
      showCaption,
      caption,
    });
    return node;
  }

  constructor(
    src: string,
    altText: string,
    width?: number | 'auto',
    height?: number | 'auto',
    maxWidth?: number,
    showCaption?: boolean,
    caption?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'auto';
    this.__height = height || 'auto';
    this.__maxWidth = maxWidth;
    this.__showCaption = showCaption || false;
    this.__caption = caption || '';
    
    // Log creation of image node for debugging
    console.log('ImageNode created with src:', src);
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      height: this.__height,
      maxWidth: this.__maxWidth,
      src: this.__src,
      width: this.__width,
      showCaption: this.__showCaption,
      caption: this.__caption,
      type: 'image',
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'editor-image-wrapper';
    // Add a data attribute to help identify this node in the DOM
    div.dataset.lexicalImageNode = 'true';
    return div;
  }

  updateDOM(): false {
    // We handle rendering via the decorator
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setWidth(width: number | 'auto'): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height: number | 'auto'): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  setCaption(caption: string): void {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  decorate(): JSX.Element {
    return <ImageComponent node={this} />;
  }
}

// Component for rendering images in the Lexical editor
function ImageComponent({ node }: { node: ImageNode }): JSX.Element {
  const src = node.getSrc();
  const altText = node.getAltText();
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState<number | 'auto'>(node.__width || 'auto');
  const [height, setHeight] = useState<number | 'auto'>(node.__height || 'auto');
  const [showCaption, setShowCaption] = useState(node.__showCaption || false);
  const [caption, setCaption] = useState(node.__caption || '');

  // Handle image deletion with keyboard
  const onDelete = useCallback(
    (event: React.KeyboardEvent<HTMLImageElement>) => {
      if (isSelected && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        const nodeSelection = $createNodeSelection();
        nodeSelection.add(node.getKey());
        $setSelection(nodeSelection);
        node.remove();
      }
      return false;
    },
    [isSelected, node],
  );

  // Handle image selection
  const onSelect = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isResizing) {
      setSelected(!isSelected);
      
      if (!isSelected) {
        const nodeSelection = $createNodeSelection();
        nodeSelection.add(node.getKey());
        $setSelection(nodeSelection);
      }
    }
  }, [isResizing, isSelected, node]);

  // Handle image resizing
  const startResizing = useCallback((event: React.MouseEvent, corner: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsResizing(true);
    
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = imageRef.current?.width || 0;
    const startHeight = imageRef.current?.height || 0;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      
      if (!imageRef.current) return;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      // Calculate new dimensions based on mouse movement and which corner is being dragged
      if (corner.includes('right')) {
        newWidth = startWidth + (moveEvent.clientX - startX);
      } else if (corner.includes('left')) {
        newWidth = startWidth - (moveEvent.clientX - startX);
      }
      
      if (corner.includes('bottom')) {
        newHeight = startHeight + (moveEvent.clientY - startY);
      } else if (corner.includes('top')) {
        newHeight = startHeight - (moveEvent.clientY - startY);
      }
      
      // Enforce minimum dimensions
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);
      
      // Update state and node properties
      setWidth(newWidth);
      setHeight(newHeight);
      node.setWidth(newWidth);
      node.setHeight(newHeight);
    };
    
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [node]);

  // Handle caption changes
  const onCaptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newCaption = e.target.value;
    setCaption(newCaption);
    node.setCaption(newCaption);
  }, [node]);

  // Toggle caption visibility
  const toggleCaption = useCallback(() => {
    const newShowCaption = !showCaption;
    setShowCaption(newShowCaption);
    node.setShowCaption(newShowCaption);
  }, [showCaption, node]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSelected(false);
      setIsResizing(false);
    };
  }, []);

  // Log rendering of image component for debugging
  useEffect(() => {
    console.log('ImageComponent rendering with src:', src);
  }, [src]);

  return (
    <div className="editor-image" data-image-node="true">
      <div className="editor-image-container" onClick={onSelect}>
        <img
          src={src}
          alt={altText}
          ref={imageRef}
          className={isSelected ? 'selected' : ''}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            cursor: isSelected ? 'move' : 'pointer',
            display: 'block',
            maxWidth: '100%',
          }}
          onKeyDown={onDelete}
          tabIndex={0}
          loading="eager"
        />
        {isSelected && (
          <>
            <div 
              className="editor-image-resizer top-left" 
              onMouseDown={(e) => startResizing(e, 'top-left')}
            />
            <div 
              className="editor-image-resizer top-right" 
              onMouseDown={(e) => startResizing(e, 'top-right')}
            />
            <div 
              className="editor-image-resizer bottom-left" 
              onMouseDown={(e) => startResizing(e, 'bottom-left')}
            />
            <div 
              className="editor-image-resizer bottom-right" 
              onMouseDown={(e) => startResizing(e, 'bottom-right')}
            />
          </>
        )}
      </div>
      {showCaption && (
        <div className="editor-image-caption">
          <input
            type="text"
            value={caption}
            onChange={onCaptionChange}
            placeholder="Add a caption..."
            className="w-full text-center bg-transparent border-none focus:outline-none"
          />
        </div>
      )}
      {isSelected && (
        <div className="flex justify-center mt-2 space-x-2">
          <button
            onClick={toggleCaption}
            className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
          >
            {showCaption ? 'Hide Caption' : 'Add Caption'}
          </button>
        </div>
      )}
    </div>
  );
}

export function $createImageNode({
  altText,
  height,
  maxWidth,
  src,
  width,
  showCaption,
  caption,
}: ImagePayload): ImageNode {
  // Log image node creation for debugging
  console.log('Creating image node with src:', src);
  
  // Ensure we have valid values
  const validatedSrc = src || '';
  const validatedAltText = altText || 'Image';
  
  return new ImageNode(
    validatedSrc,
    validatedAltText,
    width,
    height,
    maxWidth,
    showCaption,
    caption,
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
