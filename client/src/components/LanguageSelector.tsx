import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, MenuItem, SelectChangeEvent, SelectProps } from '@mui/material';

interface LanguageSelectorProps
  extends Omit<SelectProps<string>, 'value' | 'onChange'> {}

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
      <MenuItem value="es">ES</MenuItem>
      <MenuItem value="en">EN</MenuItem>
    </Select>
  );
};

export default LanguageSelector;
