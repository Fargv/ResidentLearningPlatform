import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, MenuItem, SelectChangeEvent, SelectProps } from '@mui/material';

interface LanguageSelectorProps
  extends Omit<SelectProps<string>, 'value' | 'onChange'> {}

const supportsFlagEmoji = (flag: string): boolean => {
  if (typeof document === 'undefined') return false;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx || typeof ctx.fillText !== 'function' || typeof ctx.getImageData !== 'function') {
    return false;
  }
  ctx.textBaseline = 'top';
  ctx.font = '16px Arial';
  ctx.fillText(flag, 0, 0);
  return ctx.getImageData(0, 0, 1, 1).data[3] !== 0;
};

const regionalFlags: Record<string, string> = {
  ca: '\uD83C\uDFF4\uDB40\uDC65\uDB40\uDC62\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F', // Cataluña
  gl: '\uD83C\uDFF4\uDB40\uDC65\uDB40\uDC67\uDB40\uDC62\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F', // Galicia
  eu: '\uD83C\uDFF4\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC6D\uDB40\uDC71\uDB40\uDC7F', // Euskadi
};

const getRegionalFlag = (code: keyof typeof regionalFlags): string => {
  const flag = regionalFlags[code];
  return supportsFlagEmoji(flag) ? flag : '🇪🇸';
};

const languages = [
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'it', label: '🇮🇹 IT' },
  { code: 'pt', label: '🇵🇹 PT' },
  { code: 'ca', label: `${getRegionalFlag('ca')} CA` },
  { code: 'gl', label: `${getRegionalFlag('gl')} GL` },
  { code: 'eu', label: `${getRegionalFlag('eu')} EU` },
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
        <MenuItem key={lang.code} value={lang.code}>
          {lang.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LanguageSelector;
