// Entry point: render the normal scrolling portfolio. The 3D desk + desktop OS only loads if the visitor asks for it.
import { renderSite } from './site/site.ts';
renderSite(document.getElementById('site'), () => {
  document.body.classList.add('dm'); window.scrollTo(0, 0);
  import('./desktop.js').then(m => m.startDesktop());
});
document.getElementById('exitdm').addEventListener('click', () => location.reload());
