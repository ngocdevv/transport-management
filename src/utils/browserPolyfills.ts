/**
 * Polyfills for browser APIs that are not available during server-side rendering
 * This file should be imported in components that use browser-only APIs
 */

// Check if we're running in the browser environment
export const isBrowser = typeof window !== 'undefined';

// Polyfill for ResizeObserver
export const initResizeObserverPolyfill = () => {
  if (isBrowser && !window.ResizeObserver) {
    // Simple mock implementation that does nothing
    // The real implementation will be provided by the browser
    window.ResizeObserver = class ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }
      
      private callback: ResizeObserverCallback;
      
      observe() { /* no-op */ }
      unobserve() { /* no-op */ }
      disconnect() { /* no-op */ }
    };
  }
};
