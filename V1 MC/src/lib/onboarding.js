export const ONBOARDING_STEP_KEY = 'onboarding_step';
export const COMPOSIO_IMPORT_STATUS_KEY = 'composio_import_status';

export const OnboardingStep = {
  RESUME: 'resume',
  LINKEDIN: 'linkedin',
  MANUAL: 'manual',
  PREVIEW: 'preview'
};

export const ComposioImportStatus = {
  IDLE: 'idle',
  STARTED: 'started',
  FAILED: 'failed',
  SUCCEEDED: 'succeeded'
};

export function getOnboardingStep() {
  return localStorage.getItem(ONBOARDING_STEP_KEY) || OnboardingStep.RESUME;
}

export function setOnboardingStep(step) {
  localStorage.setItem(ONBOARDING_STEP_KEY, step);
}

export function clearOnboardingStep() {
  localStorage.removeItem(ONBOARDING_STEP_KEY);
}

export function getComposioImportStatus() {
  return localStorage.getItem(COMPOSIO_IMPORT_STATUS_KEY) || ComposioImportStatus.IDLE;
}

export function setComposioImportStatus(status) {
  localStorage.setItem(COMPOSIO_IMPORT_STATUS_KEY, status);
}

export function clearComposioImportStatus() {
  localStorage.removeItem(COMPOSIO_IMPORT_STATUS_KEY);
}

