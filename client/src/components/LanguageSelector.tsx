import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, MenuItem } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      size="small"
      variant="outlined"
    >
      <MenuItem value="es">ES</MenuItem>
      <MenuItem value="en">EN</MenuItem>
    </Select>
  );
};

export default LanguageSelector;
