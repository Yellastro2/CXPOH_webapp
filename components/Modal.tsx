
import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';
import { STRINGS } from '../resources';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderName: string) => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{STRINGS.MODAL_CREATE_FOLDER.TITLE}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6 text-tg-link" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
              {STRINGS.MODAL_CREATE_FOLDER.LABEL_NAME}
            </label>
            <input
              ref={inputRef}
              type="text"
              id="folderName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-link focus:border-transparent transition-all"
              placeholder={STRINGS.MODAL_CREATE_FOLDER.PLACEHOLDER_NAME}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-full bg-tg-button text-white font-medium py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 active:scale-[0.98] transition-all"
          >
            {STRINGS.MODAL_CREATE_FOLDER.BUTTON_CREATE}
          </button>
        </form>
      </div>
    </div>
  );
};
