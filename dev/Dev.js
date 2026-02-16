import { Toolbar } from './toolbar/Toolbar.js';

class Dev {
    devToolbar;

    constructor() {
        this.devToolbar = new Toolbar();
        console.info('Dev initialized.');
    }
}

let dev;

document.addEventListener('DOMContentLoaded', () => {
    dev = new Dev();
});

export { dev };
