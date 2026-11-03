import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, X } from 'lucide-react';
import api, { resolveImage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ImageUploader({ value = [], onChange, max = 8, single = false, label = 'Photos' }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const limit = single ? 1 : max;

  const addImages = (urls) => {
    const next = [...value, ...urls].slice(0, limit);
    onChange(next);
  };

  const handleFiles = async (files) => {
    const list = Array.from(files || []).slice(0, limit - value.length);
    if (!list.length) return;
    const formData = new FormData();
    list.forEach((file) => formData.append('images', file));
    setUploading(true);
    try {
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addImages(data.urls);
      toast.success(`${data.urls.length} image${data.urls.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error('Enter a full image URL starting with http:// or https://');
      return;
    }
    addImages([trimmed]);
    setUrl('');
  };

  const remove = (index) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="uploader">
      <span className="form-label">
        {label} {!single && <span className="field-hint">({value.length}/{limit})</span>}
      </span>
      {value.length > 0 && (
        <div className="upload-previews">
          {value.map((image, index) => (
            <div className="upload-preview" key={`${image}-${index}`}>
              <img src={resolveImage(image)} alt={`Upload ${index + 1}`} loading="lazy" />
              <button
                type="button"
                className="upload-remove"
                onClick={() => remove(index)}
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < limit && (
        <>
          <button
            type="button"
            className="upload-drop"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={22} className="spin-icon" /> : <ImagePlus size={22} />}
            <strong>{uploading ? 'Uploading images…' : single ? 'Upload a photo' : 'Upload photos'}</strong>
            <span>JPG, PNG, WEBP or GIF · up to 5MB each{!single ? ` · ${limit} images max` : ''}</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={!single}
            hidden
            onChange={(event) => handleFiles(event.target.files)}
          />
          <div className="row" style={{ gap: 7 }}>
            <Link2 size={15} className="muted" />
            <input
              className="input"
              placeholder="Or paste an image URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addUrl();
                }
              }}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={addUrl}>
              Add
            </button>
          </div>
        </>
      )}
      {uploading && <span className="upload-progress">Uploading…</span>}
    </div>
  );
}
