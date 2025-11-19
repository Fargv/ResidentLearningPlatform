import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { SxProps, Theme, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { normalizeRichText, stripHtmlText } from '../utils/richText';

interface RichTextViewerProps {
  content?: string | null;
  placeholder?: string;
  minHeight?: number;
  variant?: 'card' | 'inline';
  sx?: SxProps<Theme>;
}

const RichTextViewer: React.FC<RichTextViewerProps> = ({
  content,
  placeholder,
  minHeight = 140,
  variant = 'card',
  sx,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const normalizedContent = useMemo(() => normalizeRichText(content), [content]);
  const hasContent = stripHtmlText(normalizedContent).length > 0;

  const containerStyles: SxProps<Theme> =
    variant === 'inline'
      ? {
          minHeight,
          '& p': { m: 0 },
        }
      : {
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === 'light'
              ? theme.palette.background.paper
              : theme.palette.background.default,
          p: 1.5,
          minHeight,
          '& p': { m: 0 },
        };

  return (
    <Box
      sx={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        '& a': {
          color: theme.palette.primary.main,
          textDecoration: 'underline',
        },
        ...containerStyles,
        ...sx,
      }}
    >
      {hasContent ? (
        <Box dangerouslySetInnerHTML={{ __html: normalizedContent }} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {placeholder || t('common.none')}
        </Typography>
      )}
    </Box>
  );
};

export default RichTextViewer;
