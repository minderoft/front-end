import React from 'react';

const PrivacyCheckbox = ({ isRequired = true, onChange, value = false }) => {
  return (
    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
      <input
        type="checkbox"
        id="acceptPrivacy"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: '24px',
          height: '24px',
          minWidth: '24px',
          minHeight: '24px',
          cursor: 'pointer',
          marginTop: '2px'
        }}
        required={isRequired}
      />
      <label 
        htmlFor="acceptPrivacy" 
        style={{
          fontSize: '0.95rem',
          lineHeight: '1.5',
          cursor: 'pointer',
          userSelect: 'none',
          margin: 0,
          color: '#475569'
        }}
      >
        J'accepte la{' '}
        <a 
          href="/privacy-policy.html" 
          target="_blank" 
          rel="noreferrer"
          style={{ 
            color: '#2563eb', 
            textDecoration: 'none',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          Politique de Confidentialité
        </a>
        {isRequired && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
    </div>
  );
};

export default PrivacyCheckbox;
