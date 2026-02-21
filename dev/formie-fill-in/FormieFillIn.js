/**
 * FormieFillIn – Füllt Formie-Formulare in der Entwicklungsumgebung automatisch aus.
 *
 * Initialisierung im Projekt-Dev-Script:
 *   import config from '../config.json';
 *   import { FormieFillIn } from 'profitlich-template-toolkit/dev/formie-fill-in/FormieFillIn';
 *   new FormieFillIn(config.formie);
 *
 * Konfiguration in config.json (zwei Ebenen: Form-Handle → Feld-Handle → Wert):
 *   "formie": {
 *     "kontaktformular": {
 *       "vorname": "Max",
 *       "email": "max@example.com",
 *       "nachricht": "Testanfrage"
 *     }
 *   }
 */
export class FormieFillIn {
    #formConfig;

    /**
     * @param {Object} formConfig - Aus config.json, z.B. { kontaktformular: { email: 'test@example.com' } }
     */
    constructor(formConfig) {
        if (!formConfig || typeof formConfig !== 'object') return;

        this.#formConfig = formConfig;
        document.addEventListener('onFormieInit', this.#onFormieInit);
    }

    #onFormieInit = () => {
        const forms = document.querySelectorAll('form[data-fui-form]');
        forms.forEach((formElement) => {
            const handle = this.#getFormHandle(formElement);
            if (!handle || !this.#formConfig[handle]) return;

            this.#fillForm(formElement, this.#formConfig[handle]);
            console.info(`FormieFillIn: "${handle}" ausgefüllt.`);
        });
    };

    #getFormHandle(formElement) {
        try {
            const data = JSON.parse(formElement.getAttribute('data-fui-form'));
            return data?.handle ?? null;
        } catch {
            return null;
        }
    }

    #fillForm(formElement, fields) {
        for (const [fieldHandle, value] of Object.entries(fields)) {
            const name = `fields[${fieldHandle}]`;
            const inputs = formElement.querySelectorAll(`[name="${name}"], [name="${name}[]"]`);

            if (!inputs.length) {
                console.warn(`FormieFillIn: Feld "${fieldHandle}" nicht gefunden.`);
                continue;
            }

            this.#setFieldValue(inputs, value);
        }
    }

    #setFieldValue(inputs, value) {
        const first = inputs[0];
        const type = first.type?.toLowerCase();

        if (type === 'radio') {
            inputs.forEach((radio) => {
                radio.checked = radio.value === String(value);
                if (radio.checked) radio.dispatchEvent(new Event('change', { bubbles: true }));
            });
        } else if (type === 'checkbox') {
            if (inputs.length === 1) {
                first.checked = Boolean(value);
            } else {
                // Checkbox-Gruppe: value ist Array mit den gewünschten Werten
                const selected = Array.isArray(value) ? value.map(String) : [String(value)];
                inputs.forEach((checkbox) => {
                    checkbox.checked = selected.includes(checkbox.value);
                });
            }
            inputs.forEach((cb) => cb.dispatchEvent(new Event('change', { bubbles: true })));
        } else {
            first.value = value;
            first.dispatchEvent(new Event('input', { bubbles: true }));
            first.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}
