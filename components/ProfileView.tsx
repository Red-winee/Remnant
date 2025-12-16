import React, { useEffect, useState } from 'react';
import { RelationshipProfile, ReflectionSection } from '../types';
import { getProfile, saveProfile, deleteProfile } from '../services/dbService';
import { packEncrypted, unpackAndDecrypt } from '../services/cryptoService';
import { ReflectionEditor } from './ReflectionEditor';
import { MediaGallery } from './MediaGallery';

interface ProfileViewProps {
  profileId: string;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profileId, onBack }) => {
  const [profile, setProfile] = useState<RelationshipProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'REFLECTIONS' | 'MEDIA'>('REFLECTIONS');
  // Decrypted reflections cache
  const [decryptedReflections, setDecryptedReflections] = useState<Record<ReflectionSection, string> | null>(null);
  const [editingSection, setEditingSection] = useState<ReflectionSection | null>(null);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    const p = await getProfile(profileId);
    if (!p) {
        onBack();
        return;
    }
    setProfile(p);
    
    // Decrypt all sections on load
    const decrypted: any = {};
    for (const key of Object.values(ReflectionSection)) {
        const encryptedVal = p.reflections[key];
        if (encryptedVal) {
            // encryptedVal is base64 string
            const buffer = Uint8Array.from(atob(encryptedVal), c => c.charCodeAt(0)).buffer;
            try {
                decrypted[key] = await unpackAndDecrypt(buffer);
            } catch (e) {
                decrypted[key] = "[Decryption Error]";
            }
        } else {
            decrypted[key] = "";
        }
    }
    setDecryptedReflections(decrypted);
  };

  const handleSaveReflection = async (text: string) => {
      if (!profile || !editingSection) return;

      // Encrypt
      const packedBuffer = await packEncrypted(text);
      const base64Encrypted = btoa(String.fromCharCode(...new Uint8Array(packedBuffer)));

      const updatedProfile = {
          ...profile,
          updatedAt: Date.now(),
          reflections: {
              ...profile.reflections,
              [editingSection]: base64Encrypted
          }
      };

      await saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setDecryptedReflections(prev => ({ ...prev!, [editingSection]: text }));
      setEditingSection(null);
  };

  const handleDelete = async () => {
      if (confirm("Are you sure? This will permanently delete all encrypted data and media for this relationship.")) {
          await deleteProfile(profileId);
          onBack();
      }
  };

  if (!profile || !decryptedReflections) return <div className="p-10 text-center text-teal-600">Decrypting...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-12 bg-teal-50">
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-teal-100">
          <button onClick={onBack} className="text-teal-500 hover:text-teal-800 text-lg transition-colors">←</button>
          <div className="text-center">
              <h2 className="font-semibold text-teal-900">{profile.name}</h2>
              <p className="text-xs text-teal-400">{profile.type}</p>
          </div>
          <button onClick={handleDelete} className="text-red-300 hover:text-red-500 text-sm">Delete</button>
      </div>

      <div className="flex border-b border-teal-200 bg-white">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'REFLECTIONS' ? 'text-teal-800 border-b-2 border-teal-600 bg-teal-50/50' : 'text-teal-400 hover:text-teal-600'}`}
            onClick={() => setActiveTab('REFLECTIONS')}
          >
              Reflections
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'MEDIA' ? 'text-teal-800 border-b-2 border-teal-600 bg-teal-50/50' : 'text-teal-400 hover:text-teal-600'}`}
            onClick={() => setActiveTab('MEDIA')}
          >
              Media Vault
          </button>
      </div>

      <div className="p-4">
          {activeTab === 'REFLECTIONS' ? (
              <div className="space-y-4">
                  {Object.values(ReflectionSection).map((section) => (
                      <div key={section} className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden hover:shadow-md hover:shadow-teal-900/5 transition-all">
                          <div className="bg-teal-50/50 px-4 py-2 border-b border-teal-100 flex justify-between items-center">
                              <h3 className="font-medium text-teal-700 text-sm uppercase tracking-wide">{section}</h3>
                              <button 
                                onClick={() => setEditingSection(section)}
                                className="text-xs text-teal-400 hover:text-teal-600 px-2 py-1 uppercase tracking-wider font-semibold"
                              >
                                  Edit
                              </button>
                          </div>
                          <div 
                            className="p-4 min-h-[80px] text-teal-800 whitespace-pre-wrap cursor-pointer hover:bg-teal-50/30 transition-colors leading-relaxed"
                            onClick={() => setEditingSection(section)}
                          >
                              {decryptedReflections[section] || <span className="text-teal-300 italic font-light">Empty... tap to write</span>}
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <MediaGallery profileId={profile.id} />
          )}
      </div>

      {editingSection && (
          <ReflectionEditor 
            section={editingSection}
            initialText={decryptedReflections[editingSection]}
            onSave={handleSaveReflection}
            onClose={() => setEditingSection(null)}
          />
      )}
    </div>
  );
};