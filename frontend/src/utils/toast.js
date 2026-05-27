export const toast = {
  success: (message) => window.dispatchEvent(new CustomEvent('cineplex-toast', { detail: { type: 'success', message } })),
  error: (message) => window.dispatchEvent(new CustomEvent('cineplex-toast', { detail: { type: 'error', message } })),
  info: (message) => window.dispatchEvent(new CustomEvent('cineplex-toast', { detail: { type: 'info', message } })),
};
