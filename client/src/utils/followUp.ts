import { TFunction } from 'i18next';

type FollowUpPhaseSummary = {
  faseActual?: { numero?: number; nombre?: string } | null;
  estadoFaseActual?: 'en_progreso' | 'completadas' | 'sin_iniciar' | null;
};

export const getCurrentPhaseLabel = (
  t: TFunction,
  summary: FollowUpPhaseSummary
): string => {
  const phaseNumber = summary.faseActual?.numero;
  const phaseName = summary.faseActual?.nombre;
  if (typeof phaseNumber === 'number') {
    const baseLabel = `${t('adminPhases.phase')} ${phaseNumber}`;
    return phaseName ? `${baseLabel}: ${phaseName}` : baseLabel;
  }

  switch (summary.estadoFaseActual) {
    case 'completadas':
      return t('followUp.phase.completed');
    case 'sin_iniciar':
      return t('followUp.phase.notStarted');
    case 'en_progreso':
    default:
      return t('followUp.phase.none');
  }
};
