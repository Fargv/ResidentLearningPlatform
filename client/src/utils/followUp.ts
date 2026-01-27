import { TFunction } from 'i18next';

type FollowUpPhaseSummary = {
  faseActual?: { numero?: number; nombre?: string } | null;
  estadoFaseActual?: 'en_progreso' | 'completadas' | 'sin_iniciar' | null;
};

export const getCurrentPhaseLabel = (
  t: TFunction,
  summary: FollowUpPhaseSummary
): string => {
  switch (summary.estadoFaseActual) {
    case 'completadas':
      return t('followUp.phase.completed');
    case 'sin_iniciar':
      return t('followUp.phase.notStarted');
    case 'en_progreso':
    default:
      if (summary.faseActual) {
        return t('followUp.phaseLabel', {
          number: summary.faseActual.numero,
          name: summary.faseActual.nombre
        });
      }
      return t('followUp.phase.none');
  }
};
