import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ProfileView } from './components/ProfileView';

type AppView = 'AUTH' | 'DASHBOARD' | 'PROFILE';

export default function App() {
  const [view, setView] = useState<AppView>('AUTH');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const handleUnlock = () => {
    setView('DASHBOARD');
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setView('PROFILE');
  };

  const handleBackToDashboard = () => {
    setActiveProfileId(null);
    setView('DASHBOARD');
  };

  return (
    <div className="min-h-screen w-full bg-teal-50 text-teal-900">
      {view === 'AUTH' && <AuthScreen onUnlock={handleUnlock} />}
      
      {view === 'DASHBOARD' && (
        <Dashboard onSelectProfile={handleSelectProfile} />
      )}
      
      {view === 'PROFILE' && activeProfileId && (
        <ProfileView 
          profileId={activeProfileId} 
          onBack={handleBackToDashboard} 
        />
      )}
    </div>
  );
}