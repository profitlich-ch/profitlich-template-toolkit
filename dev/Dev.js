import { Toolbar } from './toolbar/Toolbar.js';

let _config = {};

/**
* @param {Object} config - Aus config.json des Projekts
 */
export function initDev(config = {}) {
    _config = config;
}

document.addEventListener('DOMContentLoaded', () => {
    new Toolbar();
    console.info('Dev initialized.');
});
