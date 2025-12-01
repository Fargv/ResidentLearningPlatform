import React, { useEffect, useMemo, useState } from 'react';
import { isIosDevice, isStandalone } from '../utils/pwa';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCtaVisible(true);
      setInstallOutcome(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isIosDevice() && !isStandalone()) {
      setShowIosHelp(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    setInstallOutcome(choiceResult.outcome);
    setCtaVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setCtaVisible(false);
    setShowIosHelp(false);
  };

  const shouldRenderBanner = useMemo(
    () => ctaVisible || showIosHelp || Boolean(installOutcome),
    [ctaVisible, showIosHelp, installOutcome]
  );

  if (!shouldRenderBanner) {
    return null;
  }

  return (
    <div className="install-banner">
      <div className="install-banner__content">
        <div>
          <strong>Instala la aplicación</strong>
          {ctaVisible && (
            <p>
              Guarda la plataforma en tu pantalla de inicio para acceder más rápido y con
              experiencia de app.
            </p>
          )}
          {installOutcome && (
            <p>
              Preferencia registrada: {installOutcome === 'accepted' ? 'instalación iniciada' : 'instalación cancelada'}.
            </p>
          )}
          {showIosHelp && (
            <p className="install-banner__hint">
              En Safari para iOS toca <strong>Compartir</strong> y selecciona
              {' "Añadir a pantalla de inicio"'}.
            </p>
          )}
        </div>
        <div className="install-banner__actions">
          {ctaVisible && (
            <button type="button" className="install-banner__button" onClick={handleInstallClick}>
              Instalar
            </button>
          )}
          {(ctaVisible || showIosHelp) && (
            <button type="button" className="install-banner__link" onClick={handleDismiss}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
