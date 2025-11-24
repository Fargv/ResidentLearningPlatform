import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import RichTextDescriptionField from '../../components/RichTextDescriptionField';
import RichTextViewer from '../../components/RichTextViewer';
import api from '../../api';

const AdminSiteInfo: React.FC = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success' as 'success' | 'error', message: '' });

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/site-info');
      setContent(res.data?.data?.platformInfo || '');
    } catch (err: any) {
      setError(err?.response?.data?.error || t('adminSiteInfo.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.put('/site-info', { platformInfo: content });
      setSnackbar({
        open: true,
        severity: 'success',
        message: t('adminSiteInfo.saveSuccess')
      });
    } catch (err: any) {
      const message = err?.response?.data?.error || t('adminSiteInfo.saveError');
      setError(message);
      setSnackbar({
        open: true,
        severity: 'error',
        message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <BackButton />
      <Typography variant="h4" component="h1" gutterBottom>
        {t('adminSiteInfo.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {t('adminSiteInfo.subtitle')}
      </Typography>

      <Stack spacing={3} mt={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <RichTextDescriptionField
              label={t('adminSiteInfo.fields.platformInfo')}
              value={content}
              onChange={(value) => setContent(value || '')}
              minHeight={240}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('common.saving') : t('adminSiteInfo.saveButton')}
              </Button>
              <Button variant="outlined" onClick={loadContent} disabled={saving}>
                {t('common.reset')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('adminSiteInfo.previewTitle')}
          </Typography>
          {content ? (
            <RichTextViewer
              content={content}
              variant="inline"
              sx={{ '& > :last-child': { mb: 0 } }}
            />
          ) : (
            <Typography color="text.secondary">{t('adminSiteInfo.empty')}</Typography>
          )}
        </Paper>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSiteInfo;
