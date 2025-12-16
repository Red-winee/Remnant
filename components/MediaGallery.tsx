import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types';
import { saveMedia, getMediaForRelationship, deleteMedia } from '../services/dbService';
import { packEncryptedBinary, unpackAndDecryptBinary } from '../services/cryptoService';
import { v4 as uuidv4 } from 'uuid';

interface MediaGalleryProps {
  profileId: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ profileId }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
    return () => {
        // Cleanup blob URLs to prevent memory leaks
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [profileId]);

  const loadMedia = async () => {
    setLoading(true);
    const items = await getMediaForRelationship(profileId);
    setMedia(items.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    
    // Encrypt
    const encryptedBlob = await packEncryptedBinary(buffer);
    
    const newItem: MediaItem = {
      id: uuidv4(),
      relationshipId: profileId,
      mimeType: file.type,
      blob: encryptedBlob,
      timestamp: Date.now()
    };

    await saveMedia(newItem);
    setMedia([newItem, ...media]);
  };

  const handleView = async (item: MediaItem) => {
      try {
        const decryptedBuffer = await unpackAndDecryptBinary(item.blob);
        const blob = new Blob([decryptedBuffer], { type: item.mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (e) {
          alert("Decryption failed for this item.");
      }
  };

  const handleClosePreview = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-teal-200 border-dashed rounded-xl appearance-none cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 focus:outline-none group">
            <span className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-teal-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="font-medium text-teal-500 group-hover:text-teal-700 transition-colors">Add secure photo/video</span>
            </span>
            <input type="file" name="file_upload" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
        </label>
      </div>

      {loading ? (
          <div className="text-center text-teal-400">Loading vault...</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
            {media.map(item => (
                <div key={item.id} onClick={() => handleView(item)} className="aspect-square bg-teal-100 rounded-lg overflow-hidden relative cursor-pointer group shadow-sm">
                    <div className="absolute inset-0 flex items-center justify-center text-teal-300">
                        {item.mimeType.startsWith('video') ? '▶️' : '🔒'}
                    </div>
                    {/* In a real app, we would decrypt a small thumbnail here. For MVP/Perf, we show lock icon until clicked */}
                    <div className="absolute inset-0 bg-teal-900/0 group-hover:bg-teal-900/20 transition-colors" />
                </div>
            ))}
        </div>
      )}

      {previewUrl && (
          <div className="fixed inset-0 z-50 bg-teal-950 flex flex-col animate-fade-in">
              <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={handleClosePreview} 
                    className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 shadow-lg border border-white/10"
                  >
                    ✕
                  </button>
              </div>
              
              <div className="flex-1 w-full h-full flex items-center justify-center p-2" onClick={handleClosePreview}>
                  <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                      <object 
                        data={previewUrl} 
                        className="max-w-screen max-h-screen w-auto h-auto object-contain shadow-2xl"
                        type={previewUrl.includes('video') ? 'video/mp4' : 'image/jpeg'} // Crude type fallback if needed, object usually handles it
                      >
                          <div className="flex flex-col items-center justify-center text-white">
                              <p>Unable to display media</p>
                          </div>
                      </object>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};