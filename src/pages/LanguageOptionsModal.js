// src/components/LanguageOptionsModal.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '../pages/LanguageProvider'; // Adjust path as needed
import '../LanguageSelector.css'; // This modal will use the same CSS

const LanguageOptionsModal = ({ isOpen, setIsOpen }) => {
  const { currentLanguage, setCurrentLanguage, t, languages } = useContext(LanguageContext); // Get languages from context
  const [tempSelectedLanguage, setTempSelectedLanguage] = useState(currentLanguage);
  // `languages` is now from context, so no need to define `languages = Object.keys(translations);` here


  const selectorRef = useRef(null);

  useEffect(() => {
    setTempSelectedLanguage(currentLanguage);
  }, [isOpen, currentLanguage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const handleConfirm = () => {
    setCurrentLanguage(tempSelectedLanguage);
    setIsOpen(false);
  };

  const handleLanguageClick = (lang) => {
    setTempSelectedLanguage(lang);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="language-overlay">
      <div className="language-selector" ref={selectorRef}>
        <button
          className="close-button"
          onClick={() => setIsOpen(false)}
          title={t('close')}
        >
          ✖️
        </button>
        <div className="language-dropdown">
          <p className="choose-label">{t('chooseLanguage')}</p>
          <ul>
            {languages.map((lang) => ( // Use languages from context
              <li
                key={lang}
                className={lang === tempSelectedLanguage ? 'active' : ''}
                onClick={() => handleLanguageClick(lang)}
              >
                {lang}
              </li>
            ))}
          </ul>
        </div>
        <button
          className="submit-button"
          onClick={handleConfirm}
          title={t('confirmSelection')}
        >
          {t('confirmSelection')}
        </button>
      </div>
    </div>
  );
};

export default LanguageOptionsModal;