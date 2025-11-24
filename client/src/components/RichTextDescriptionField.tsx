import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { normalizeRichText, stripHtmlText } from '../utils/richText';

interface RichTextDescriptionFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

type ToolbarCommand =
  | 'bold'
  | 'italic'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink';

const RichTextDescriptionField: React.FC<RichTextDescriptionFieldProps> = ({
  label,
  value,
  onChange,
  minHeight = 220,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value || '');

  // Cuando NO estamos editando, mantén el draft sincronizado con value
  useEffect(() => {
    if (!isEditing) {
      setDraft(value || '');
    }
  }, [isEditing, value]);

  // Pintar el contenido inicial cuando NO estamos editando (modo lectura)
  useEffect(() => {
    if (!isEditing && editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [isEditing, value]);
  
  const initEditor = useCallback(() => {
  if (editorRef.current) {
    editorRef.current.innerHTML = draft || '';
    editorRef.current.focus();
  }
}, [draft]); // Esto NO rompe el cursor porque solo se ejecuta cuando yo la llamo

        useEffect(() => {
      if (isEditing) {
        initEditor();
      }
    }, [isEditing, initEditor]);

  const toolbarItems = useMemo(
    () => [
      { command: 'bold' as ToolbarCommand, icon: <FormatBoldIcon fontSize="small" />, label: t('richText.bold') },
      { command: 'italic' as ToolbarCommand, icon: <FormatItalicIcon fontSize="small" />, label: t('richText.italic') },
      {
        command: 'insertUnorderedList' as ToolbarCommand,
        icon: <FormatListBulletedIcon fontSize="small" />,
        label: t('richText.bulletList'),
      },
      {
        command: 'insertOrderedList' as ToolbarCommand,
        icon: <FormatListNumberedIcon fontSize="small" />,
        label: t('richText.orderedList'),
      },
      { command: 'createLink' as ToolbarCommand, icon: <LinkIcon fontSize="small" />, label: t('richText.link') },
    ],
    [t],
  );

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    // Actualizamos el estado, pero ya NO reescribimos innerHTML desde ningún efecto
    setDraft(html);
  }, []);

  const execCommand = useCallback(
    (command: ToolbarCommand) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      if (command === 'createLink') {
        const url = window.prompt(t('common.enterUrl'), 'https://')?.trim();
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } else {
        document.execCommand(command, false);
      }
      // Después de aplicar el comando, leemos el contenido actual
      handleInput();
    },
    [handleInput, t],
  );

  const handleSave = () => {
    const normalized = normalizeRichText(draft);
    const cleanText = stripHtmlText(normalized);
    onChange(cleanText ? normalized : '');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft(value || '');
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  };

  const showPlaceholder = !isEditing && !stripHtmlText(value || '').length;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        <Box
          ref={editorRef}
          role="textbox"
          aria-label={label}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={handleInput}
          sx={{
            minHeight,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            p: 2,
            bgcolor: theme.palette.background.paper,
            overflowY: 'auto',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            '&:focus': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        />
        {showPlaceholder && (
          <Typography
            color="text.secondary"
            sx={{
              position: 'absolute',
              top: 16,
              left: 20,
              pointerEvents: 'none',
            }}
          >
            {t('common.none')}
          </Typography>
        )}
      </Box>
      {!isEditing ? (
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
            {t('common.edit')}
          </Button>
        </Box>
      ) : (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{ mt: 1 }}
        >
          <ButtonGroup variant="outlined" size="small">
            {toolbarItems.map((item) => (
              <Button key={item.command} onClick={() => execCommand(item.command)} aria-label={item.label}>
                {item.icon}
              </Button>
            ))}
          </ButtonGroup>
          <Box flexGrow={1} />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button startIcon={<CloseIcon />} onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleSave}
            >
              {t('common.saveChanges')}
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default RichTextDescriptionField;
