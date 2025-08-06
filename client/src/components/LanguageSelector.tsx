import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, MenuItem, SelectChangeEvent, SelectProps } from '@mui/material';

import esFlag from '../assets/flags/es.svg';
import gbFlag from '../assets/flags/gb.svg';
import frFlag from '../assets/flags/fr.svg';
import deFlag from '../assets/flags/de.svg';
import itFlag from '../assets/flags/it.svg';
import ptFlag from '../assets/flags/pt.svg';
import caFlag from '../assets/flags/ca.svg';
import glFlag from '../assets/flags/gl.svg';
import euFlag from '../assets/flags/eu.svg';

interface LanguageSelectorProps
  extends Omit<SelectProps<string>, 'value' | 'onChange'> {}

const languages = [
  { code: 'es', label: 'ES', icon: esFlag },
  { code: 'en', label: 'EN', icon: gbFlag },
  { code: 'fr', label: 'FR', icon: frFlag },
  { code: 'de', label: 'DE', icon: deFlag },
  { code: 'it', label: 'IT', icon: itFlag },
  { code: 'pt', label: 'PT', icon: ptFlag },
  { code: 'ca', label: 'CA', icon: caFlag },
  { code: 'gl', label: 'GL', icon: glFlag },
  { code: 'eu', label: 'EU', icon: euFlag },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
  const { i18n } = useTranslation();

  const handleChange = (event: SelectChangeEvent<string>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Select<string>
      {...props}
      value={i18n.language}
      onChange={handleChange}
      size="small"
      variant="outlined"
    >
      {languages.map((lang) => (
        <MenuItem
          key={lang.code}
          value={lang.code}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <img src={lang.icon} alt={lang.label} width={20} height={14} />
          {lang.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LanguageSelector;
