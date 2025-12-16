import React, { useEffect, useState } from 'react';
import { RelationshipProfile, RelationshipType, ReflectionSection } from '../types';
import { getAllProfiles, saveProfile } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
  onSelectProfile: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState<RelationshipProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<RelationshipType>(RelationshipType.UNDEFINED);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const data = await getAllProfiles();
    // Sort by updated recently
    setProfiles(data.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProfile: RelationshipProfile = {
      id: uuidv4(),
      name: newName,
      type: newType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reflections: Object.values(ReflectionSection).reduce((acc, section) => {
        acc[section] = ""; 
        return acc;
      }, {} as Record<ReflectionSection, string>)
    };

    await saveProfile(newProfile);
    setProfiles([newProfile, ...profiles]);
    setIsCreating(false);
    setNewName('');
    onSelectProfile(newProfile.id);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 px-4 pt-12">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-teal-900 tracking-tight">Archives</h1>
          <p className="text-teal-600/70 text-sm mt-1">{profiles.length} relationships stored locally</p>
        </div>
      </header>

      {isCreating ? (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 mb-6 animate-fade-in">
          <h2 className="text-lg font-medium text-teal-800 mb-4">New Archive</h2>
          <input
            type="text"
            placeholder="Name or Alias"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-3 bg-teal-50 border border-teal-100 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400 text-teal-900 placeholder-teal-300"
            autoFocus
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as RelationshipType)}
            className="w-full p-3 bg-teal-50 border border-teal-100 rounded-lg mb-6 focus:outline-none text-teal-800"
          >
            {Object.values(RelationshipType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-900/20"
            >
              Create
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full py-4 mb-6 border-2 border-dashed border-teal-200 rounded-2xl text-teal-400 font-medium hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2"
        >
          <span>+</span> Add New Relationship
        </button>
      )}

      <div className="space-y-4">
        {profiles.map((profile) => (
          <div 
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-teal-100 cursor-pointer hover:shadow-md hover:shadow-teal-900/5 hover:border-teal-200 transition-all active:scale-[0.99]"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium text-teal-900">{profile.name}</h3>
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-teal-50 text-teal-600 text-xs rounded-md border border-teal-100">
                  {profile.type}
                </span>
              </div>
              <span className="text-xs text-teal-400 font-light">
                {new Date(profile.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {profiles.length === 0 && !isCreating && (
           <div className="text-center py-20 text-teal-300">
               <p>No archives found.</p>
           </div>
        )}
      </div>
    </div>
  );
};