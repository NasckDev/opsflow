import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { mockApiInterceptor } from './core/api/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash location: deep links funcionam no GitHub Pages sem fallback 404.
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
  ],
};
