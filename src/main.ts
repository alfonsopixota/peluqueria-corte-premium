import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error('Angular bootstrap error:', err);
    document.body.innerHTML = `<div style="padding:2rem;color:red;background:#111;font-family:monospace">
      <h2>Error al iniciar la aplicación</h2>
      <pre>${err.message ?? err}</pre>
      <pre style="font-size:11px;color:#888">${err.stack ?? ''}</pre>
    </div>`;
  });
