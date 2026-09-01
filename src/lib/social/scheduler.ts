import { refreshSocialIntelligence } from './social-engine';

declare global {
  // eslint-disable-next-line no-var
  var __profileDarkSocialScheduler: NodeJS.Timeout | undefined;
}

export function ensureSocialScheduler() {
  refreshSocialIntelligence();
  if (global.__profileDarkSocialScheduler) return;
  const timer = setInterval(() => refreshSocialIntelligence(true), 5 * 60 * 60_000);
  timer.unref?.();
  global.__profileDarkSocialScheduler = timer;
}
