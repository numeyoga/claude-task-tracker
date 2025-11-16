'use strict';

import { formatTime, formatDuration, getEntryTypeLabel, createElement } from './utils.js';
import { ENTRY_TYPES } from './time-entry.js';
import { DayStatus } from './calculator.js';

/**
 * Gestion de l'interface utilisateur
 */
export class TimeTrackerUI {
    constructor() {
        // Cache des éléments DOM
        this.elements = {
            clockInBtn: null,
            lunchStartBtn: null,
            lunchEndBtn: null,
            clockOutBtn: null,
            presenceTime: null,
            presencePercentage: null,
            remainingTime: null,
            entriesList: null,
            dayStatus: null
        };

        // Callbacks
        this.onEditEntry = null;
        this.onDeleteEntry = null;
    }

    /**
     * Initialise les références aux éléments DOM
     */
    init() {
        this.elements.clockInBtn = document.getElementById('clock-in-btn');
        this.elements.lunchStartBtn = document.getElementById('lunch-start-btn');
        this.elements.lunchEndBtn = document.getElementById('lunch-end-btn');
        this.elements.clockOutBtn = document.getElementById('clock-out-btn');
        this.elements.presenceTime = document.getElementById('presence-time');
        this.elements.presencePercentage = document.getElementById('presence-percentage');
        this.elements.remainingTime = document.getElementById('remaining-time');
        this.elements.entriesList = document.getElementById('entries-list');
        this.elements.dayStatus = document.getElementById('day-status');

        console.log('✅ UI initialisée');
    }

    // ======================
    // Méthodes publiques - Boutons
    // ======================

    /**
     * Met à jour l'état des boutons en fonction du prochain pointage attendu
     * @param {string|null} nextExpectedEntry - Type du prochain pointage ou null
     */
    updateButtons(nextExpectedEntry) {
        const buttons = {
            [ENTRY_TYPES.CLOCK_IN]: this.elements.clockInBtn,
            [ENTRY_TYPES.LUNCH_START]: this.elements.lunchStartBtn,
            [ENTRY_TYPES.LUNCH_END]: this.elements.lunchEndBtn,
            [ENTRY_TYPES.CLOCK_OUT]: this.elements.clockOutBtn
        };

        // Désactiver tous les boutons
        Object.values(buttons).forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.remove('clock-in__button--active');
            }
        });

        // Activer le bouton approprié
        if (nextExpectedEntry && buttons[nextExpectedEntry]) {
            buttons[nextExpectedEntry].disabled = false;
            buttons[nextExpectedEntry].classList.add('clock-in__button--active');
        }
    }

    /**
     * Ajoute un écouteur d'événement sur un bouton
     * @param {string} entryType - Type de pointage
     * @param {Function} callback - Fonction à appeler lors du clic
     */
    onButtonClick(entryType, callback) {
        const buttons = {
            [ENTRY_TYPES.CLOCK_IN]: this.elements.clockInBtn,
            [ENTRY_TYPES.LUNCH_START]: this.elements.lunchStartBtn,
            [ENTRY_TYPES.LUNCH_END]: this.elements.lunchEndBtn,
            [ENTRY_TYPES.CLOCK_OUT]: this.elements.clockOutBtn
        };

        const button = buttons[entryType];
        if (button) {
            button.addEventListener('click', callback);
        }
    }

    // ======================
    // Méthodes publiques - Affichage du temps
    // ======================

    /**
     * Met à jour l'affichage du temps de présence
     * @param {number} duration - Durée en millisecondes
     * @param {number} percentage - Pourcentage de l'objectif atteint
     * @param {number} remaining - Temps restant en millisecondes
     */
    updatePresenceDisplay(duration, percentage, remaining) {
        // Temps de présence
        if (this.elements.presenceTime) {
            this.elements.presenceTime.textContent = formatDuration(duration);
        }

        // Pourcentage
        if (this.elements.presencePercentage) {
            this.elements.presencePercentage.textContent = `${percentage}%`;

            // Changer la couleur selon le pourcentage
            if (percentage >= 100) {
                this.elements.presencePercentage.classList.add('daily-presence-bar__percentage--complete');
                this.elements.presencePercentage.classList.remove('daily-presence-bar__percentage--warning');
            } else if (percentage >= 90) {
                this.elements.presencePercentage.classList.add('daily-presence-bar__percentage--warning');
                this.elements.presencePercentage.classList.remove('daily-presence-bar__percentage--complete');
            } else {
                this.elements.presencePercentage.classList.remove(
                    'daily-presence-bar__percentage--complete',
                    'daily-presence-bar__percentage--warning'
                );
            }
        }

        // Temps restant
        if (this.elements.remainingTime) {
            if (remaining > 0) {
                this.elements.remainingTime.textContent = `Reste: ${formatDuration(remaining)}`;
            } else {
                this.elements.remainingTime.textContent = 'Objectif atteint!';
            }
        }
    }

    /**
     * Met à jour l'affichage du statut de la journée
     * @param {string} status - Statut de la journée (DayStatus)
     */
    updateDayStatus(status) {
        if (!this.elements.dayStatus) return;

        const statusLabels = {
            [DayStatus.NOT_STARTED]: 'Pas encore commencé',
            [DayStatus.MORNING]: 'Matinée en cours',
            [DayStatus.LUNCH]: 'Pause déjeuner',
            [DayStatus.AFTERNOON]: 'Après-midi en cours',
            [DayStatus.COMPLETED]: 'Journée terminée'
        };

        this.elements.dayStatus.textContent = statusLabels[status] || status;
        this.elements.dayStatus.className = `daily-presence-bar__status daily-presence-bar__status--${status}`;
    }

    // ======================
    // Méthodes publiques - Liste des pointages
    // ======================

    /**
     * Affiche la liste des pointages du jour
     * @param {TimeEntry[]} entries - Liste des pointages (triés par timestamp)
     */
    renderEntries(entries) {
        if (!this.elements.entriesList) return;

        // Vider la liste actuelle
        this.elements.entriesList.innerHTML = '';

        if (!entries || entries.length === 0) {
            const emptyMessage = createElement(
                'li',
                { class: 'entries-list__empty' },
                'Aucun pointage pour aujourd\'hui'
            );
            this.elements.entriesList.appendChild(emptyMessage);
            return;
        }

        // Créer les éléments de liste
        entries.forEach(entry => {
            const listItem = this.#createEntryListItem(entry);
            this.elements.entriesList.appendChild(listItem);
        });
    }

    /**
     * Crée un élément de liste pour un pointage
     * @param {TimeEntry} entry - Pointage à afficher
     * @returns {HTMLElement} Élément li
     * @private
     */
    #createEntryListItem(entry) {
        const time = formatTime(entry.timestamp);
        const label = getEntryTypeLabel(entry.type);

        // Icône en fonction du type
        const icon = this.#getEntryIcon(entry.type);

        const listItem = createElement('li', {
            class: `entries-list__item entries-list__item--${entry.type}`
        });

        const iconSpan = createElement('span', {
            class: 'entries-list__icon'
        }, icon);

        const labelSpan = createElement('span', {
            class: 'entries-list__label'
        }, label);

        const timeSpan = createElement('span', {
            class: 'entries-list__time'
        }, time);

        // Boutons d'action
        const actionsContainer = createElement('span', {
            class: 'entries-list__actions'
        });

        // Bouton modifier
        const editBtn = createElement('button', {
            class: 'entries-list__btn entries-list__btn--edit',
            title: 'Modifier l\'heure'
        }, '✏️');
        editBtn.addEventListener('click', () => {
            if (this.onEditEntry) {
                this.onEditEntry(entry);
            }
        });

        // Bouton supprimer
        const deleteBtn = createElement('button', {
            class: 'entries-list__btn entries-list__btn--delete',
            title: 'Supprimer'
        }, '🗑️');
        deleteBtn.addEventListener('click', () => {
            if (this.onDeleteEntry) {
                this.onDeleteEntry(entry);
            }
        });

        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(deleteBtn);

        listItem.appendChild(iconSpan);
        listItem.appendChild(labelSpan);
        listItem.appendChild(timeSpan);
        listItem.appendChild(actionsContainer);

        return listItem;
    }

    /**
     * Retourne l'icône appropriée pour un type de pointage
     * @param {string} type - Type de pointage
     * @returns {string} Icône (émoji)
     * @private
     */
    #getEntryIcon(type) {
        const icons = {
            [ENTRY_TYPES.CLOCK_IN]: '🟢',
            [ENTRY_TYPES.LUNCH_START]: '🍽️',
            [ENTRY_TYPES.LUNCH_END]: '✅',
            [ENTRY_TYPES.CLOCK_OUT]: '🔴'
        };

        return icons[type] || '⏱️';
    }

    // ======================
    // Méthodes publiques - Messages
    // ======================

    /**
     * Affiche un message de succès temporaire
     * @param {string} message - Message à afficher
     */
    showSuccess(message) {
        this.#showToast(message, 'success');
    }

    /**
     * Affiche un message d'erreur temporaire
     * @param {string} message - Message à afficher
     */
    showError(message) {
        this.#showToast(message, 'error');
    }

    /**
     * Affiche un toast (notification temporaire)
     * @param {string} message - Message à afficher
     * @param {string} type - Type de toast (success, error)
     * @private
     */
    #showToast(message, type) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = createElement('div', {
            class: `toast toast--${type}`
        }, message);

        document.body.appendChild(toast);

        // Animation d'apparition
        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);

        // Suppression après 3 secondes
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
