import { DecoratorNode, LexicalEditor, NodeKey, SerializedLexicalNode, Spread, createCommand, LexicalCommand } from 'lexical';
import * as React from 'react';

export type VideoPayload = {
  src: string;
  altText?: string;
  width?: string | number;
  height?: string | number;
  showCaption?: boolean;
};

export const INSERT_VIDEO_COMMAND: LexicalCommand<VideoPayload> = createCommand('INSERT_VIDEO_COMMAND');

function isYouTubeOrVimeo(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function getYouTubeEmbedUrl(url: string) {
  // Basic YouTube URL to embed conversion
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

function getVimeoEmbedUrl(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return url;
}

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: string | number;
  __height: string | number;
  __showCaption: boolean;

  static getType() {
    return 'video';
  }

  static clone(node: VideoNode) {
    return new VideoNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__key
    );
  }

  constructor(
    src: string,
    altText = '',
    width: string | number = 'auto',
    height: string | number = 'auto',
    showCaption = false,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__showCaption = showCaption;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const { src, altText, width, height, showCaption } = serializedNode;
    return new VideoNode(src, altText, width, height, showCaption);
  }

  exportJSON(): SerializedVideoNode {
    return {
      type: 'video',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      showCaption: this.__showCaption,
    };
  }

  decorate(): JSX.Element {
    const src = this.__src;
    const alt = this.__altText;
    const width = this.__width;
    const height = this.__height;
    const showCaption = this.__showCaption;
    let embed = null;
    if (isYouTubeOrVimeo(src)) {
      let embedUrl = src;
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        embedUrl = getYouTubeEmbedUrl(src);
      } else if (src.includes('vimeo.com')) {
        embedUrl = getVimeoEmbedUrl(src);
      }
      embed = (
        <iframe
          src={embedUrl}
          title={alt || 'Embedded video'}
          width={width || '100%'}
          height={height || 360}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
        />
      );
    } else if (src.match(/\.(mp4|webm|ogg)$/i)) {
      embed = (
        <video
          src={src}
          controls
          width={width || '100%'}
          height={height || 360}
          style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
        >
          {alt && <track kind="captions" label={alt} />}
        </video>
      );
    } else {
      embed = <a href={src} target="_blank" rel="noopener noreferrer">{src}</a>;
    }
    return (
      <div className="editor-video" data-video-node="true">
        {embed}
        {showCaption && (
          <div className="editor-video-caption">
            <input
              type="text"
              value={alt}
              readOnly
              className="w-full text-center bg-transparent border-none focus:outline-none"
            />
          </div>
        )}
      </div>
    );
  }
}

export type SerializedVideoNode = Spread<
  {
    type: 'video';
    version: 1;
    src: string;
    altText: string;
    width: string | number;
    height: string | number;
    showCaption: boolean;
  },
  SerializedLexicalNode
>;

export function $createVideoNode(payload: VideoPayload): VideoNode {
  return new VideoNode(
    payload.src,
    payload.altText || '',
    payload.width || 'auto',
    payload.height || 'auto',
    payload.showCaption || false
  );
} 