// Shared UI state. `act` is filled in by main.js so view modules can trigger actions without importing each other.
export const app = { week: 1, selected: null, view: 'arena', hiddenSeries: new Set(), ST: null };
export const act = {};
