'use strict';

import { formatTime } from './utils.js';

/**
 * UI pour la gestion de toutes les entrées
 */
export class EntriesManagementUI {
    constructor() {
        this.section = null;
        this.listContainer = null;
        this.closeBtn = null;

        // Callbacks
        this.onEditEntry = null;
        this.onDeleteEntry = null;
        this.onRefresh = null;
    }

    /**
     * Initialise l'interface
     */
    init() {
        this.section = document.getElementById('entries-management-section');
        this.listContainer = document.getElementById('all-entries-list');
        this.closeBtn = document.getElementById('close-entries-management-btn');

        this.setupEventListeners();

        console.log('✅ Entries Management UI initialisée');
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    /**
     * Affiche la section
     */
    show() {
        if (this.section) {
            this.section.classList.add('entries-management-section--visible');
            document.body.style.overflow = 'hidden'; // Empêche le scroll du body

            // Charger les entrées
            if (this.onRefresh) {
                this.onRefresh();
            }
        }
    }

    /**
     * Cache la section
     */
    hide() {
        if (this.section) {
            this.section.classList.remove('entries-management-section--visible');
            document.body.style.overflow = ''; // Restore le scroll du body
        }
    }

    /**
     * Affiche toutes les entrées
     * @param {TimeEntry[]} entries - Liste des entrées à afficher
     */
    renderAllEntries(entries) {
        if (!this.listContainer) return;

        // Vider le conteneur
        this.listContainer.innerHTML = '';

        if (entries.length === 0) {
            this.listContainer.innerHTML = `
                <div class="all-entries-list__empty">
                    Aucune entrée de pointage enregistrée
                </div>
            `;
            return;
        }

        // Grouper les entrées par date
        const entriesByDate = this.groupEntriesByDate(entries);

        // Créer les éléments pour chaque date
        Object.keys(entriesByDate).forEach(date => {
            const dateGroup = this.createDateGroup(date, entriesByDate[date]);
            this.listContainer.appendChild(dateGroup);
        });
    }

    /**
     * Groupe les entrées par date
     * @param {TimeEntry[]} entries - Liste des entrées
     * @returns {Object} Entrées groupées par date
     */
    groupEntriesByDate(entries) {
        const grouped = {};

        entries.forEach(entry => {
            if (!grouped[entry.date]) {
                grouped[entry.date] = [];
            }
            grouped[entry.date].push(entry);
        });

        return grouped;
    }

    /**
     * Crée un groupe de date avec ses entrées
     * @param {string} date - Date au format YYYY-MM-DD
     * @param {TimeEntry[]} entries - Liste des entrées pour cette date
     * @returns {HTMLElement} Élément DOM du groupe
     */
    createDateGroup(date, entries) {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';

        // Header de la date
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-group__header';
        dateHeader.innerHTML = `
            <h3 class="date-group__title">${this.formatDateHeader(date)}</h3>
            <span class="date-group__count">${entries.length} entrée(s)</span>
        `;
        dateGroup.appendChild(dateHeader);

        // Liste des entrées
        const entriesList = document.createElement('div');
        entriesList.className = 'date-group__entries';

        entries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            entriesList.appendChild(entryElement);
        });

        dateGroup.appendChild(entriesList);

        return dateGroup;
    }

    /**
     * Crée un élément d'entrée
     * @param {TimeEntry} entry - Entrée à afficher
     * @returns {HTMLElement} Élément DOM de l'entrée
     */
    createEntryElement(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'entry-item';
        entryDiv.dataset.entryId = entry.id;

        const icon = this.getEntryIcon(entry.type);
        const label = this.getEntryLabel(entry.type);
        const time = formatTime(entry.timestamp);

        entryDiv.innerHTML = `
            <div class="entry-item__left">
                <span class="entry-item__icon">${icon}</span>
                <div class="entry-item__info">
                    <span class="entry-item__label">${label}</span>
                    <span class="entry-item__time">${time}</span>
                </div>
            </div>
            <div class="entry-item__actions">
                <button class="entry-item__btn entry-item__btn--edit" data-action="edit" title="Modifier">
                    ✏️
                </button>
                <button class="entry-item__btn entry-item__btn--delete" data-action="delete" title="Supprimer">
                    🗑️
                </button>
            </div>
        `;

        // Ajouter les écouteurs d'événements
        const editBtn = entryDiv.querySelector('[data-action="edit"]');
        const deleteBtn = entryDiv.querySelector('[data-action="delete"]');

        if (editBtn && this.onEditEntry) {
            editBtn.addEventListener('click', () => {
                this.onEditEntry(entry);
            });
        }

        if (deleteBtn && this.onDeleteEntry) {
            deleteBtn.addEventListener('click', () => {
                this.onDeleteEntry(entry);
            });
        }

        return entryDiv;
    }

    /**
     * Formate une date pour l'en-tête
     * @param {string} dateStr - Date au format YYYY-MM-DD
     * @returns {string} Date formatée
     */
    formatDateHeader(dateStr) {
        const date = new Date(dateStr + 'T12:00:00'); // Midi pour éviter les problèmes de timezone
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Formater la date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formatted = date.toLocaleDateString('fr-FR', options);

        // Ajouter "Aujourd'hui" ou "Hier" si applicable
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dateStr === todayStr) {
            return `Aujourd'hui - ${formatted}`;
        } else if (dateStr === yesterdayStr) {
            return `Hier - ${formatted}`;
        }

        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    /**
     * Retourne l'icône pour un type d'entrée
     * @param {string} type - Type d'entrée
     * @returns {string} Icône
     */
    getEntryIcon(type) {
        const icons = {
            'clock-in': '🟢',
            'lunch-start': '🍽️',
            'lunch-end': '✅',
            'clock-out': '🔴'
        };
        return icons[type] || '📌';
    }

    /**
     * Retourne le label pour un type d'entrée
     * @param {string} type - Type d'entrée
     * @returns {string} Label
     */
    getEntryLabel(type) {
        const labels = {
            'clock-in': 'Arrivée',
            'lunch-start': 'Début pause',
            'lunch-end': 'Fin pause',
            'clock-out': 'Départ'
        };
        return labels[type] || type;
    }

    /**
     * Affiche un message de succès
     * @param {string} message - Message à afficher
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message - Message à afficher
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Affiche un toast
     * @param {string} message - Message à afficher
     * @param {string} type - Type de toast ('success' ou 'error')
     */
    showToast(message, type) {
        // Créer le toast
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;

        // Ajouter au body
        document.body.appendChild(toast);

        // Afficher avec un délai pour l'animation
        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);

        // Masquer après 3 secondes
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}
