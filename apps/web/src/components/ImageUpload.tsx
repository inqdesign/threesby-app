import React, { useState } from 'react';
import { UploadCloud, X as XIcon } from 'lucide-react';

type ImageUploadProps = {
  onImageSelected: (file: File) => void;
  currentUrl?: string;
  className?: string;
  buttonText?: string;
  loading?: boolean;
  title?: string;
  darkFont?: boolean;
  showInstructions?: boolean;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB - will be compressed before storage

export function ImageUpload({ onImageSelected, currentUrl, className = '', buttonText = 'Upload Image', loading: isLoading = false, title = 'COLLECTION TITLE', darkFont = false, showInstructions = true }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isLoading);

  const validateFile = (file: File): boolean => {
    setError(null);

    if (!file) {
      setError('No file selected');
      return false;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      handleFileChange(file);
    }
  };

  const handleFileChange = (file: File) => {
    try {
      setLoading(true);
      setError(null);

      if (!validateFile(file)) {
        setLoading(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setLoading(false);
        // Only call onImageSelected if validation passes
        onImageSelected(file);
      };
      reader.onerror = () => {
        setError('Failed to read the image file');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'Error processing image');
      setLoading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {error && <p className="text-red-500 text-base mb-2 text-center">{error}</p>}
      {preview ? (
        <div className="relative w-full h-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
            style={{ objectFit: 'cover' }}
            onError={() => {
              setPreview('https://placehold.co/400x400/e2e8f0/64748b?text=No+Image');
            }}
            onClick={() => {
              // Allow clicking on the image to trigger file selection
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file && validateFile(file)) {
                  handleFileChange(file);
                }
              };
              input.click();
            }}
          />
          <div className="absolute top-2 left-2 text-[10px] font-medium z-10 bg-black/20 px-1 rounded">
            <span className={darkFont ? 'text-black' : 'text-white'}>ISSUE #00</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
            <h3 className={`${darkFont ? 'text-black' : 'text-white'} font-bold text-sm leading-tight`}>
              {title || 'COLLECTION TITLE'}
            </h3>
          </div>
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-0 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors flex items-center justify-center w-7 h-7 min-h-0 z-20"
            style={{ minHeight: '0' }}
            aria-label="Remove image"
          >
            <XIcon className="w-4 h-4 text-black" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`
              relative border-2 border-dashed border-gray-300 rounded-lg
              hover:border-black transition-colors text-center
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${className}
              flex items-center justify-center
              aspect-[5/7] w-full h-full overflow-hidden
            `}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && validateFile(file)) {
                  handleFileChange(file);
                }
              }}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center p-2">
              <UploadCloud className="h-10 w-10 text-gray-400" />
              {loading && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
          
          {showInstructions && (
            <div className="mt-3 text-center w-full">
              <div className="flex justify-center text-sm leading-6 text-gray-600">
                <span className="font-medium text-gray-700">{buttonText}</span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}