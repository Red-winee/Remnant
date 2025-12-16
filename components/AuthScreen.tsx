import React, { useState } from 'react';
import { checkPin, setupPin, hasStoredPin } from '../services/cryptoService';

interface AuthScreenProps {
  onUnlock: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSetup] = useState(!hasStoredPin());
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDigit = (digit: string) => {
    setError('');
    if (isSetup && pin.length >= 4 && confirmPin.length < 4) {
        setConfirmPin(prev => prev + digit);
    } else if (pin.length < 4) {
        setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setError('');
    if (isSetup && confirmPin.length > 0) {
        setConfirmPin(prev => prev.slice(0, -1));
    } else {
        setPin(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Slight delay to allow UI to render spinner
    setTimeout(async () => {
        try {
            if (isSetup) {
                if (pin !== confirmPin) {
                    setError("PINs do not match");
                    setConfirmPin('');
                    setIsLoading(false);
                    return;
                }
                await setupPin(pin);
                onUnlock();
            } else {
                const isValid = await checkPin(pin);
                if (isValid) {
                    onUnlock();
                } else {
                    setError("Incorrect PIN");
                    setPin('');
                }
            }
        } catch (e) {
            setError("Authentication failed");
        } finally {
            setIsLoading(false);
        }
    }, 50);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-teal-950 text-teal-50 p-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-light tracking-[0.2em] uppercase mb-3 text-teal-100">Remnant</h1>
        <p className="text-teal-400/80 text-sm tracking-wide">
            {isSetup ? "Create your secure access PIN" : "Enter PIN to access archive"}
        </p>
      </div>

      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full border border-teal-500/50 transition-all duration-300 ${pin.length > i ? 'bg-teal-200 scale-110 border-teal-200' : 'bg-transparent'}`} />
        ))}
      </div>
      
      {isSetup && pin.length === 4 && (
          <div className="flex flex-col items-center mb-6 animate-fade-in">
              <p className="text-xs text-teal-400 mb-2 uppercase tracking-wider">Confirm PIN</p>
              <div className="flex gap-4">
                {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full border border-teal-500/50 ${confirmPin.length > i ? 'bg-teal-200' : 'bg-transparent'}`} />
                ))}
            </div>
          </div>
      )}

      {error && <p className="text-red-300 text-sm mb-6 bg-red-900/20 px-4 py-1 rounded-full">{error}</p>}

      <div className="grid grid-cols-3 gap-6 w-72">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num.toString())}
            className="w-16 h-16 rounded-full bg-teal-900/40 hover:bg-teal-800 border border-teal-800/50 flex items-center justify-center text-2xl font-light text-teal-100 transition-all active:scale-95"
          >
            {num}
          </button>
        ))}
        <div className="col-span-1"></div>
        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-full bg-teal-900/40 hover:bg-teal-800 border border-teal-800/50 flex items-center justify-center text-2xl font-light text-teal-100 transition-all active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full text-teal-400 hover:text-teal-200 flex items-center justify-center font-medium transition-colors"
        >
          ⌫
        </button>
      </div>
      
      {((isSetup && confirmPin.length === 4) || (!isSetup && pin.length === 4)) && (
          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="mt-10 px-10 py-3 bg-teal-100 text-teal-900 font-semibold rounded-full tracking-wide hover:bg-white hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all disabled:opacity-50"
          >
              {isLoading ? 'Unlocking...' : (isSetup ? 'Set PIN' : 'Unlock Vault')}
          </button>
      )}
    </div>
  );
};