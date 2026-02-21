import { Toolbar } from './toolbar/Toolbar.js';
import { FormieFillIn } from './formie-fill-in/FormieFillIn.js';

let _config = {};

/**
* @param {Object} config - Aus config.json des Projekts
 */
export function initDev(config = {}) {
    _config = config;
}

document.addEventListener('DOMContentLoaded', () => {
    new Toolbar();
    if (_config.formie) {
        new FormieFillIn(_config.formie);
    }
    console.info('Dev initialized.');
});
