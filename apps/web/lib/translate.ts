/**
 * Page translation using Google's free website translator (no API key needed).
 * The script is only loaded when someone actually picks a language other than English.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'hi', label: 'हिन्दी (HI)' },
  { code: 'te', label: 'తెలుగు (TE)' },
  { code: 'ta', label: 'தமிழ் (TA)' },
  { code: 'bn', label: 'বাংলা (BN)' },
  { code: 'mr', label: 'मराठी (MR)' },
  { code: 'es', label: 'Español (ES)' },
] as const;

const CONTAINER_ID = 'google_translate_element';
const SCRIPT_ID = 'google-translate-script';

interface GoogleTranslateWindow extends Window {
  google?: {
    translate?: {
      TranslateElement?: new (options: Record<string, unknown>, containerId: string) => unknown;
    };
  };
  googleTranslateElementInit?: () => void;
}

function setCookie(value: string, maxAge: number) {
  const base = `googtrans=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = base;
  // Google also reads the cookie on the parent domain, but "localhost" has no parent domain
  if (location.hostname.includes('.')) {
    document.cookie = `${base}; domain=.${location.hostname}`;
  }
}

/** The language currently stored in the cookie, or "en". */
export function getSavedLanguage(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    const code = match?.[1]?.split('/')[2];
    return code && LANGUAGES.some((l) => l.code === code) ? code : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Google's widget changes the page by editing the DOM directly. React then trips over text nodes
 * that moved ("Failed to execute removeChild"). These two guards make React skip those cases.
 */
function protectReactFromTranslation() {
  const flag = '__smartcareTranslateGuard';
  const w = window as unknown as Record<string, unknown>;
  if (w[flag]) return;
  w[flag] = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

function ensureContainer() {
  if (document.getElementById(CONTAINER_ID)) return;
  const el = document.createElement('div');
  el.id = CONTAINER_ID;
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
  document.body.appendChild(el);
}

/** Loads Google's translator once. Resolves when its language list (`.goog-te-combo`) exists. */
export function loadTranslator(): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const w = window as GoogleTranslateWindow;
    protectReactFromTranslation();
    ensureContainer();

    const waitForCombo = () => {
      let tries = 0;
      const timer = window.setInterval(() => {
        const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        tries += 1;
        if (combo || tries > 50) {
          window.clearInterval(timer);
          resolve(combo);
        }
      }, 100);
    };

    if (w.google?.translate?.TranslateElement) {
      if (!document.querySelector('.goog-te-combo')) {
        new w.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: LANGUAGES.filter((l) => l.code !== 'en')
              .map((l) => l.code)
              .join(','),
            autoDisplay: false,
          },
          CONTAINER_ID
        );
      }
      waitForCombo();
      return;
    }

    w.googleTranslateElementInit = () => {
      new w.google!.translate!.TranslateElement!(
        {
          pageLanguage: 'en',
          includedLanguages: LANGUAGES.filter((l) => l.code !== 'en')
            .map((l) => l.code)
            .join(','),
          autoDisplay: false,
        },
        CONTAINER_ID
      );
      waitForCombo();
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    }
  });
}

/** Switch the page language. Returns false if Google's translator could not be reached. */
export async function applyLanguage(code: string): Promise<boolean> {
  if (code === 'en') {
    // Clearing the cookie and reloading is the only reliable way back to the original text
    setCookie('', 0);
    location.reload();
    return true;
  }

  setCookie(`/en/${code}`, 60 * 60 * 24 * 30);
  const combo = await loadTranslator();
  if (!combo) return false;
  combo.value = code;
  combo.dispatchEvent(new Event('change'));
  return true;
}
