export class MailAdresses {
    static #instance;

    #domain;

    constructor(domain) {
        this.#domain = domain;
        this.init();
    }

    init() {
        document.querySelectorAll('[data-eml]').forEach(adresse => {
            let eml = adresse.getAttribute('data-eml');
            let emlText = eml + '@' + this.#domain;
            let emlAddress = 'mailto:' + emlText;
            adresse.setAttribute('href', emlAddress);
            adresse.innerHTML = emlText;
        });
    }

    static getInstance(domain) {
        if (!MailAdresses.#instance) {
            MailAdresses.#instance = new MailAdresses(domain);
        }
        return MailAdresses.#instance;
    }
}
