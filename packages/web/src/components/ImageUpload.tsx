import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader, Image as ImageIcon, Link as LinkIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
}

// Get API URL from environment or use default
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // @ts-ignore - Vite env vars
    return import.meta.env?.VITE_API_URL || (import.meta.env?.PROD ? "" : "http://localhost:3001");
  }
  return "http://localhost:3001";
};

const API_URL = getApiUrl();

export const ImageUpload = ({ value, onChange, label }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Please login first");
        setUploading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          onChange(data.url);
          setError("");
        } else {
          setError("No URL returned from server");
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        setError(errorData.error || "Failed to upload image");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className='image-upload-wrapper'>
      <label className='upload-label'>{label}</label>

      <AnimatePresence mode='wait'>
        {value ? (
          <motion.div
            key='preview'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='image-preview'
          >
            <img src={value} alt='Preview' />
            <div className='preview-overlay'>
              <button className='remove-btn' onClick={handleRemove} type='button'>
                <X size={18} />
                Remove
              </button>
            </div>
            <div className='preview-badge'>
              <Check size={14} />
              Uploaded
            </div>
          </motion.div>
        ) : (
          <motion.div
            key='uploader'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleInputChange}
              style={{ display: "none" }}
              disabled={uploading}
            />

            <div
              className={`upload-zone ${isDragging ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {uploading ? (
                <div className='upload-loading'>
                  <Loader size={32} className='spinner' />
                  <span>Uploading to Cloudinary...</span>
                </div>
              ) : (
                <>
                  <div className='upload-icon'>
                    <ImageIcon size={28} />
                  </div>
                  <div className='upload-text'>
                    <span className='upload-primary'>
                      <Upload size={16} /> Click to upload
                    </span>
                    <span className='upload-secondary'>or drag and drop</span>
                  </div>
                  <span className='upload-hint'>PNG, JPG, GIF, WebP up to 5MB</span>
                </>
              )}
            </div>

            {/* URL Input Toggle */}
            <div className='url-section'>
              <button type='button' className='url-toggle' onClick={() => setShowUrlInput(!showUrlInput)}>
                <LinkIcon size={14} />
                {showUrlInput ? "Hide URL input" : "Or paste image URL"}
              </button>

              <AnimatePresence>
                {showUrlInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className='url-input-wrapper'
                  >
                    <input
                      type='url'
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder='https://example.com/image.jpg'
                      className='url-input'
                      onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    />
                    <button type='button' className='url-submit' onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                      <Check size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='upload-error'>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <style>{`
        .image-upload-wrapper {
          margin-bottom: 0;
        }

        .upload-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 10px;
        }

        .upload-zone {
          border: 2px dashed rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(102, 126, 234, 0.05);
        }

        .upload-zone:hover {
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(102, 126, 234, 0.1);
        }

        .upload-zone.dragging {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.15);
          transform: scale(1.02);
        }

        .upload-zone.uploading {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .upload-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #667eea;
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
        }

        .upload-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #667eea;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .upload-secondary {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }

        .upload-hint {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
        }

        .upload-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #667eea;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .image-preview {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.05);
        }

        .image-preview img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-preview:hover .preview-overlay {
          opacity: 1;
        }

        .remove-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 1);
          transform: scale(1.05);
        }

        .preview-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(34, 197, 94, 0.9);
          border-radius: 50px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .url-section {
          margin-top: 12px;
        }

        .url-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .url-toggle:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .url-input-wrapper {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          overflow: hidden;
        }

        .url-input {
          flex: 1;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .url-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .url-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .url-submit {
          padding: 10px 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .url-submit:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .url-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-error {
          margin-top: 10px;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #f87171;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};
