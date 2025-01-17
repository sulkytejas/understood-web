import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './redux/store';
import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SocketProvider } from './components/context/SocketContext';

// -- Sentry Initialization Here --
Sentry.init({
  dsn: 'https://7b3b94b9868bc33db21f7729a665e5be@o4508654193541120.ingest.us.sentry.io/4508654213988352',

  integrations: [
    Sentry.replayIntegration(),
    // React Router v6 integration:
    Sentry.reactRouterV6BrowserTracingIntegration({
      // This instrumentation is needed to properly track
      // route changes and performance for react-router v6
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),

    // Alternatively, you can do the older approach:
    // new BrowserTracing({
    //   routingInstrumentation: Sentry.reactRouterV6Instrumentation(
    //     useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes
    //   ),
    // }),

    // Session Replay integration:
    // new Replay(),
  ],

  // Performance Tracing
  tracesSampleRate: 1.0,
  tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],

  // Session Replay sampling
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <SocketProvider>
          <App />
        </SocketProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </Provider>,
  // </React.StrictMode>,
);

// src/index.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log(
          'ServiceWorker registration successful with scope: ',
          registration.scope,
        );
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
