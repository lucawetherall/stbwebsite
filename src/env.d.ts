/// <reference types="astro/client" />

interface ConsentState {
  analytics?: boolean;
  maps?: boolean;
  youtube?: boolean;
  newsletter?: boolean;
}

interface Window {
  /** Set early in Base.astro from localStorage; gates third-party embeds. */
  __consent?: ConsentState;
  /** ChurchDesk newsletter signup widget, loaded on demand. */
  CHURCH_DESK_SIGNUP_NAMESPACE?: {
    SignUp: new (opts: { organizationId: number; element?: HTMLElement }) => unknown;
  };
}

interface WindowEventMap {
  'stb:consent': CustomEvent<ConsentState>;
}
