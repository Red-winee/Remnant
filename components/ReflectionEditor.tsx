import React, { useState } from 'react';
import { ReflectionSection } from '../types';
import { generateReflection, ReflectionResult } from '../services/aiService';

interface ReflectionEditorProps {
  section: ReflectionSection;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({ section, initialText, onSave, onClose }) => {
  const [text, setText] = useState(initialText);
  const [isThinking, setIsThinking] = useState(false);
  const [aiResult, setAiResult] = useState<ReflectionResult | null>(null);

  const handleReflect = async () => {
    if (text.length < 20) return;
    setIsThinking(true);
    setAiResult(null);
    try {
      const result = await generateReflection(text);
      setAiResult(result);
    } catch (e) {
      alert("AI Reflection unavailable offline or error occurred.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl shadow-teal-900/20 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-teal-100 flex justify-between items-center bg-teal-50/50 rounded-t-2xl">
          <h3 className="font-semibold text-teal-800">{section}</h3>
          <button onClick={onClose} className="text-teal-400 hover:text-teal-600">✕</button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <textarea
            className="w-full h-48 p-4 text-teal-900 text-lg leading-relaxed bg-teal-50/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 placeholder-teal-300/50"
            placeholder="Write your thoughts here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-teal-400">{text.length} characters</p>
            {text.length > 20 && (
              <button
                onClick={handleReflect}
                disabled={isThinking}
                className="text-xs font-medium text-teal-700 px-3 py-1.5 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors flex items-center gap-1 shadow-sm"
              >
                {isThinking ? (
                    <span className="animate-pulse">Thinking...</span>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
                        AI Reflect
                    </>
                )}
              </button>
            )}
          </div>

          {aiResult && (
            <div className="mt-6 bg-gradient-to-br from-teal-50 to-white rounded-xl p-5 border border-teal-100 animate-fade-in shadow-inner">
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-3">AI Insights</h4>
              <p className="text-sm text-teal-800 mb-4 italic leading-relaxed">"{aiResult.summary}"</p>
              
              <div className="mb-4">
                <p className="text-xs font-semibold text-teal-600 mb-2">Deep Questions:</p>
                <ul className="list-disc list-inside space-y-2">
                  {aiResult.questions.map((q, i) => (
                    <li key={i} className="text-sm text-teal-700 pl-1">{q}</li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-2 border-t border-teal-100">
                <span className="text-xs font-semibold text-teal-600">Lesson: </span>
                <span className="text-sm text-teal-700">{aiResult.lesson}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-teal-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(text)}
            className="px-6 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-md shadow-teal-900/20"
          >
            Save Reflection
          </button>
        </div>
      </div>
    </div>
  );
};