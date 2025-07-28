// LanguageGlobe.jsx
import React, { useState } from 'react';
import '../LanguageSelector.css';

const LanguageGlobe = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = ['Arabic', 'English', 'Spanish'];

  return (
    <>
      <img
        src="https://cdn-icons-png.flaticon.com/512/44/44386.png"
        alt="Globe Icon"
        className="globe-icon"
        onClick={() => setIsOpen(true)}
        title="Change Language"
        style={{ cursor: 'pointer' }}
      />

      {isOpen && (
        <div className="language-overlay">
          <div className="language-selector">
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              ✖️
            </button>

            <div className="language-dropdown">
              <p className="choose-label">Choose language</p>
              <ul>
                {languages.map((lang) => (
                  <li
                    key={lang}
                    className={lang === selectedLanguage ? 'active' : ''}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="submit-button"
              onClick={() => setIsOpen(false)}
              title="Submit"
            >
              ✔️
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageGlobe;
