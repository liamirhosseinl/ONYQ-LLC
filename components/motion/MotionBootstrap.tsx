
/**
 * Runs before first paint:
 * 1. Theme — the visitor's saved choice (localStorage "onyq.theme"), otherwise the system
 *    preference. Sets <html data-theme> so there is no flash of the wrong theme.
 * 2. Motion — sets data-motion="full" unless reduced motion is requested. Watchdog: if the
 *    client bundle hasn't started 4 s after the window load event (or 20 s at the latest),
 *    the flag is removed so nothing stays hidden, and data-motion-fallback is set. When the
 *    bundle does start later (slow network, first dev compile), motionAllowed() restores
 *    full motion — a slow first visit never leaves the site without its animations.
 */
const SCRIPT = `(function(){var d=document.documentElement;try{var t=null;try{t=localStorage.getItem('onyq.theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.dataset.theme=t;}catch(e){d.dataset.theme='dark'}try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.dataset.motion='full';try{if(!navigator.webdriver&&!sessionStorage.getItem('onyq.intro'))d.dataset.intro='play'}catch(e){}var check=function(){if(!window.__onyqMotionReady&&d.dataset.motion){delete d.dataset.motion;delete d.dataset.intro;d.dataset.motionFallback='1';}};if(document.readyState==='complete'){setTimeout(check,4000);}else{window.addEventListener('load',function(){setTimeout(check,4000);});}setTimeout(check,20000);}catch(e){}})();`;

/**
 * A plain inline <script> in <head>: the browser runs it synchronously while parsing the
 * HTML, before first paint and before any bundle has loaded (next/script's beforeInteractive
 * travels inside the RSC payload and only runs once the framework chunk arrives, which on a
 * slow first visit is too late). `nonce` comes from the per-request Content-Security-Policy.
 */
export function MotionBootstrap({ nonce }: { nonce?: string }) {
  return <script id="onyq-motion-bootstrap" nonce={nonce} dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
