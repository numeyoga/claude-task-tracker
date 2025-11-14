'use strict';

import { createElement } from './utils.js';

/**
 * Classe pour gérer les popovers
 */
export class Popover {
    /**
     * @param {string} title - Titre de la popover
     */
    constructor(title) {
        this.title = title;
        this.element = null;
        this.overlay = null;
        this.onClose = null;
    }

    /**
     * Crée la structure HTML de la popover
     * @param {HTMLElement} content - Contenu de la popover
     * @returns {HTMLElement}
     * @private
     */
    #createPopoverElement(content) {
        // Overlay semi-transparent
        this.overlay = createElement('div', {
            class: 'popover-overlay'
        });
        this.overlay.addEventListener('click', () => this.close());

        // Container de la popover
        const popover = createElement('div', {
            class: 'popover'
        });

        // Header
        const header = createElement('div', {
            class: 'popover__header'
        });

        const titleEl = createElement('h3', {
            class: 'popover__title'
        }, this.title);

        const closeBtn = createElement('button', {
            class: 'popover__close',
            type: 'button'
        }, '×');
        closeBtn.addEventListener('click', () => this.close());

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Body
        const body = createElement('div', {
            class: 'popover__body'
        }, content);

        popover.appendChild(header);
        popover.appendChild(body);

        return popover;
    }

    /**
     * Affiche la popover
     * @param {HTMLElement} content - Contenu de la popover
     */
    show(content) {
        // Créer les éléments
        this.element = this.#createPopoverElement(content);

        // Ajouter au DOM
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.element);

        // Ajouter la classe visible après un court délai pour l'animation
        setTimeout(() => {
            this.overlay.classList.add('popover-overlay--visible');
            this.element.classList.add('popover--visible');
        }, 10);

        // Bloquer le scroll du body
        document.body.style.overflow = 'hidden';

        // Gérer la touche Escape
        this.#handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.#handleEscape);
    }

    /**
     * Ferme la popover
     */
    close() {
        if (!this.element) return;

        // Retirer les classes pour l'animation
        this.overlay.classList.remove('popover-overlay--visible');
        this.element.classList.remove('popover--visible');

        // Attendre la fin de l'animation avant de retirer du DOM
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
            this.overlay = null;

            // Réactiver le scroll du body
            document.body.style.overflow = '';

            // Retirer l'écouteur d'événement Escape
            document.removeEventListener('keydown', this.#handleEscape);

            // Appeler le callback onClose si défini
            if (this.onClose) {
                this.onClose();
            }
        }, 300);
    }
}

/**
 * Popover pour ajouter du temps rétroactif à un projet
 */
export class AddRetroactiveTimePopover extends Popover {
    /**
     * @param {Project} project - Projet auquel ajouter du temps
     * @param {Function} onSubmit - Callback appelé lors de la soumission (reçoit les données)
     */
    constructor(project, onSubmit) {
        super('Ajouter du temps rétroactif');
        this.project = project;
        this.onSubmit = onSubmit;
    }

    /**
     * Crée le formulaire d'ajout de temps rétroactif
     * @returns {HTMLElement}
     * @private
     */
    #createForm() {
        const form = createElement('form', {
            class: 'retroactive-time-form'
        });

        // Champ projet (lecture seule)
        const projectGroup = createElement('div', {
            class: 'form-group'
        });
        const projectLabel = createElement('label', {
            class: 'form-label'
        }, 'Projet');
        const projectInput = createElement('input', {
            type: 'text',
            class: 'form-input',
            value: this.project.name,
            readonly: true
        });
        projectGroup.appendChild(projectLabel);
        projectGroup.appendChild(projectInput);

        // Champ date
        const dateGroup = createElement('div', {
            class: 'form-group'
        });
        const dateLabel = createElement('label', {
            class: 'form-label',
            for: 'retroactive-date'
        }, 'Date');
        const dateInput = createElement('input', {
            type: 'date',
            id: 'retroactive-date',
            class: 'form-input',
            value: new Date().toISOString().split('T')[0],
            required: true
        });
        dateGroup.appendChild(dateLabel);
        dateGroup.appendChild(dateInput);

        // Champ heure de début
        const startTimeGroup = createElement('div', {
            class: 'form-group'
        });
        const startTimeLabel = createElement('label', {
            class: 'form-label',
            for: 'retroactive-start-time'
        }, 'Heure de début');
        const startTimeInput = createElement('input', {
            type: 'time',
            id: 'retroactive-start-time',
            class: 'form-input',
            value: '09:00',
            required: true
        });
        startTimeGroup.appendChild(startTimeLabel);
        startTimeGroup.appendChild(startTimeInput);

        // Options: Durée OU Heure de fin
        const durationOrEndGroup = createElement('div', {
            class: 'form-group'
        });
        const durationOrEndLabel = createElement('label', {
            class: 'form-label'
        }, 'Durée ou heure de fin');

        // Radio buttons pour choisir entre durée et heure de fin
        const radioGroup = createElement('div', {
            class: 'radio-group'
        });

        const durationRadio = createElement('input', {
            type: 'radio',
            id: 'input-type-duration',
            name: 'input-type',
            value: 'duration',
            checked: true
        });
        const durationRadioLabel = createElement('label', {
            for: 'input-type-duration',
            class: 'radio-label'
        }, 'Durée');

        const endTimeRadio = createElement('input', {
            type: 'radio',
            id: 'input-type-endtime',
            name: 'input-type',
            value: 'endtime'
        });
        const endTimeRadioLabel = createElement('label', {
            for: 'input-type-endtime',
            class: 'radio-label'
        }, 'Heure de fin');

        radioGroup.appendChild(durationRadio);
        radioGroup.appendChild(durationRadioLabel);
        radioGroup.appendChild(endTimeRadio);
        radioGroup.appendChild(endTimeRadioLabel);

        durationOrEndGroup.appendChild(durationOrEndLabel);
        durationOrEndGroup.appendChild(radioGroup);

        // Champ durée (en heures et minutes)
        const durationInputGroup = createElement('div', {
            class: 'form-group form-group--duration',
            id: 'duration-input-group'
        });
        const durationLabel = createElement('label', {
            class: 'form-label',
            for: 'retroactive-duration-hours'
        }, 'Durée');

        const durationInputs = createElement('div', {
            class: 'duration-inputs'
        });

        const hoursInput = createElement('input', {
            type: 'number',
            id: 'retroactive-duration-hours',
            class: 'form-input form-input--small',
            min: '0',
            max: '23',
            value: '1',
            placeholder: 'h'
        });
        const hoursLabel = createElement('span', {
            class: 'duration-unit'
        }, 'h');

        const minutesInput = createElement('input', {
            type: 'number',
            id: 'retroactive-duration-minutes',
            class: 'form-input form-input--small',
            min: '0',
            max: '59',
            value: '0',
            placeholder: 'min'
        });
        const minutesLabel = createElement('span', {
            class: 'duration-unit'
        }, 'min');

        durationInputs.appendChild(hoursInput);
        durationInputs.appendChild(hoursLabel);
        durationInputs.appendChild(minutesInput);
        durationInputs.appendChild(minutesLabel);

        durationInputGroup.appendChild(durationLabel);
        durationInputGroup.appendChild(durationInputs);

        // Champ heure de fin
        const endTimeInputGroup = createElement('div', {
            class: 'form-group form-group--hidden',
            id: 'endtime-input-group'
        });
        const endTimeLabel = createElement('label', {
            class: 'form-label',
            for: 'retroactive-end-time'
        }, 'Heure de fin');
        const endTimeInput = createElement('input', {
            type: 'time',
            id: 'retroactive-end-time',
            class: 'form-input',
            value: '10:00'
        });
        endTimeInputGroup.appendChild(endTimeLabel);
        endTimeInputGroup.appendChild(endTimeInput);

        // Gérer le changement de type d'entrée (durée vs heure de fin)
        const toggleInputType = () => {
            const isDuration = durationRadio.checked;
            durationInputGroup.classList.toggle('form-group--hidden', !isDuration);
            endTimeInputGroup.classList.toggle('form-group--hidden', isDuration);
        };

        durationRadio.addEventListener('change', toggleInputType);
        endTimeRadio.addEventListener('change', toggleInputType);

        // Boutons d'action
        const actionsGroup = createElement('div', {
            class: 'form-actions'
        });

        const cancelBtn = createElement('button', {
            type: 'button',
            class: 'btn btn--secondary'
        }, 'Annuler');
        cancelBtn.addEventListener('click', () => this.close());

        const submitBtn = createElement('button', {
            type: 'submit',
            class: 'btn btn--primary'
        }, 'Ajouter');

        actionsGroup.appendChild(cancelBtn);
        actionsGroup.appendChild(submitBtn);

        // Assembler le formulaire
        form.appendChild(projectGroup);
        form.appendChild(dateGroup);
        form.appendChild(startTimeGroup);
        form.appendChild(durationOrEndGroup);
        form.appendChild(durationInputGroup);
        form.appendChild(endTimeInputGroup);
        form.appendChild(actionsGroup);

        // Gérer la soumission du formulaire
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.#handleSubmit(dateInput, startTimeInput, hoursInput, minutesInput, endTimeInput, durationRadio);
        });

        return form;
    }

    /**
     * Gère la soumission du formulaire
     * @private
     */
    #handleSubmit(dateInput, startTimeInput, hoursInput, minutesInput, endTimeInput, durationRadio) {
        const date = dateInput.value;
        const startTime = startTimeInput.value;

        // Construire la date/heure de début
        const startDateTime = new Date(`${date}T${startTime}`);

        let endDateTime;

        if (durationRadio.checked) {
            // Mode durée
            const hours = parseInt(hoursInput.value) || 0;
            const minutes = parseInt(minutesInput.value) || 0;
            const durationMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);

            if (durationMs <= 0) {
                alert('La durée doit être supérieure à 0.');
                return;
            }

            endDateTime = new Date(startDateTime.getTime() + durationMs);
        } else {
            // Mode heure de fin
            const endTime = endTimeInput.value;
            endDateTime = new Date(`${date}T${endTime}`);

            if (endDateTime <= startDateTime) {
                alert('L\'heure de fin doit être après l\'heure de début.');
                return;
            }
        }

        // Préparer les données
        const data = {
            projectId: this.project.id,
            startTime: startDateTime,
            endTime: endDateTime,
            date: date
        };

        // Appeler le callback
        if (this.onSubmit) {
            this.onSubmit(data);
        }

        // Fermer la popover
        this.close();
    }

    /**
     * Affiche la popover
     */
    show() {
        const form = this.#createForm();
        super.show(form);
    }
}
