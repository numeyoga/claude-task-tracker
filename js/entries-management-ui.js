'use strict';

import { formatTime } from './utils.js';
import { ENTRY_TYPES } from './time-entry.js';

/**
 * UI pour la gestion de toutes les entrées
 */
export class EntriesManagementUI {
    constructor() {
        this.section = null;
        this.listContainer = null;
        this.closeBtn = null;
        this.infoElement = null;
        this.addEntryBtn = null;

        // Modal d'ajout de pointage
        this.addEntryModal = null;
        this.addEntryForm = null;
        this.closeAddEntryModalBtn = null;
        this.cancelAddEntryBtn = null;

        // Filtre de période
        this.periodFilter = null; // { startDate: Date, endDate: Date, label: string }

        // Callbacks
        this.onEditEntry = null;
        this.onDeleteEntry = null;
        this.onAddEntry = null;
        this.onRefresh = null;
    }

    /**
     * Initialise l'interface
     */
    init() {
        this.section = document.getElementById('entries-management-section');
        this.listContainer = document.getElementById('all-entries-list');
        this.closeBtn = document.getElementById('close-entries-management-btn');
        this.infoElement = this.section?.querySelector('.entries-management-section__info p');
        this.addEntryBtn = document.getElementById('add-entry-btn');

        // Éléments du modal d'ajout
        this.addEntryModal = document.getElementById('add-entry-modal');
        this.addEntryForm = document.getElementById('add-entry-form');
        this.closeAddEntryModalBtn = document.getElementById('close-add-entry-modal-btn');
        this.cancelAddEntryBtn = document.getElementById('cancel-add-entry-btn');

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

        // Bouton d'ajout de pointage
        if (this.addEntryBtn) {
            this.addEntryBtn.addEventListener('click', () => {
                this.showAddEntryModal();
            });
        }

        // Fermeture du modal d'ajout
        if (this.closeAddEntryModalBtn) {
            this.closeAddEntryModalBtn.addEventListener('click', () => {
                this.hideAddEntryModal();
            });
        }

        if (this.cancelAddEntryBtn) {
            this.cancelAddEntryBtn.addEventListener('click', () => {
                this.hideAddEntryModal();
            });
        }

        // Soumission du formulaire d'ajout
        if (this.addEntryForm) {
            this.addEntryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddEntry();
            });
        }

        // Fermeture du modal en cliquant sur l'overlay
        if (this.addEntryModal) {
            const overlay = this.addEntryModal.querySelector('.modal__overlay');
            if (overlay) {
                overlay.addEventListener('click', () => {
                    this.hideAddEntryModal();
                });
            }
        }
    }

    /**
     * Définit un filtre de période
     * @param {Object} filter - Filtre avec startDate, endDate et label
     */
    setPeriodFilter(filter) {
        this.periodFilter = filter;
        this.updateInfoMessage();
    }

    /**
     * Réinitialise le filtre de période
     */
    clearPeriodFilter() {
        this.periodFilter = null;
        this.updateInfoMessage();
    }

    /**
     * Met à jour le message d'information selon le filtre
     */
    updateInfoMessage() {
        if (!this.infoElement) return;

        if (this.periodFilter) {
            this.infoElement.textContent = `Entrées de pointage pour la période : ${this.periodFilter.label}`;
        } else {
            this.infoElement.textContent = 'Toutes vos entrées de pointage dans l\'ordre antéchronologique (du plus récent au plus ancien).';
        }
    }

    /**
     * Affiche la section
     */
    show() {
        if (this.section) {
            this.section.classList.add('entries-management-section--visible');
            document.body.style.overflow = 'hidden'; // Empêche le scroll du body

            // S'assurer que le bouton "Ajouter un pointage" est visible
            if (this.addEntryBtn) {
                this.addEntryBtn.style.display = '';
            }

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

        // Appliquer le filtre de période si défini
        let filteredEntries = entries;
        if (this.periodFilter) {
            filteredEntries = this.filterEntriesByPeriod(entries, this.periodFilter.startDate, this.periodFilter.endDate);
        }

        if (filteredEntries.length === 0) {
            const message = this.periodFilter
                ? 'Aucune entrée de pointage pour cette période'
                : 'Aucune entrée de pointage enregistrée';
            this.listContainer.innerHTML = `
                <div class="all-entries-list__empty">
                    ${message}
                </div>
            `;
            return;
        }

        // Grouper les entrées par date
        const entriesByDate = this.groupEntriesByDate(filteredEntries);

        // Créer les éléments pour chaque date
        Object.keys(entriesByDate).forEach(date => {
            const dateGroup = this.createDateGroup(date, entriesByDate[date]);
            this.listContainer.appendChild(dateGroup);
        });
    }

    /**
     * Filtre les entrées par période
     * @param {TimeEntry[]} entries - Liste des entrées
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {TimeEntry[]} Entrées filtrées
     */
    filterEntriesByPeriod(entries, startDate, endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= start && entryDate <= end;
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
            [ENTRY_TYPES.CLOCK_IN]: '🟢',
            [ENTRY_TYPES.BREAK_START]: '⏸️',
            [ENTRY_TYPES.BREAK_END]: '▶️',
            [ENTRY_TYPES.LUNCH_START]: '🍽️', // Compatibilité
            [ENTRY_TYPES.LUNCH_END]: '✅', // Compatibilité
            [ENTRY_TYPES.CLOCK_OUT]: '🔴'
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
            [ENTRY_TYPES.CLOCK_IN]: 'Arrivée',
            [ENTRY_TYPES.BREAK_START]: 'Début pause',
            [ENTRY_TYPES.BREAK_END]: 'Fin pause',
            [ENTRY_TYPES.LUNCH_START]: 'Début pause', // Compatibilité
            [ENTRY_TYPES.LUNCH_END]: 'Fin pause', // Compatibilité
            [ENTRY_TYPES.CLOCK_OUT]: 'Départ'
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

    /**
     * Affiche le modal d'ajout de pointage
     */
    showAddEntryModal() {
        if (!this.addEntryModal) return;

        // Initialiser les valeurs par défaut
        const dateInput = document.getElementById('entry-date');
        const timeInput = document.getElementById('entry-time');
        const typeSelect = document.getElementById('entry-type');

        if (dateInput) {
            // Définir la date par défaut à aujourd'hui
            const today = new Date();
            dateInput.value = today.toISOString().split('T')[0];
            dateInput.max = today.toISOString().split('T')[0]; // Empêcher les dates futures
        }

        if (timeInput) {
            // Définir l'heure par défaut à maintenant
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }

        if (typeSelect) {
            typeSelect.value = '';
        }

        // Afficher le modal
        this.addEntryModal.classList.add('modal--active');
    }

    /**
     * Cache le modal d'ajout de pointage
     */
    hideAddEntryModal() {
        if (!this.addEntryModal) return;

        this.addEntryModal.classList.remove('modal--active');

        // Réinitialiser le formulaire
        if (this.addEntryForm) {
            this.addEntryForm.reset();
        }
    }

    /**
     * Gère l'ajout d'un nouveau pointage
     */
    handleAddEntry() {
        const dateInput = document.getElementById('entry-date');
        const timeInput = document.getElementById('entry-time');
        const typeSelect = document.getElementById('entry-type');

        if (!dateInput || !timeInput || !typeSelect) {
            this.showError('Formulaire invalide');
            return;
        }

        const dateValue = dateInput.value;
        const timeValue = timeInput.value;
        const typeValue = typeSelect.value;

        if (!dateValue || !timeValue || !typeValue) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        // Créer le timestamp
        const timestamp = new Date(`${dateValue}T${timeValue}:00`);

        // Vérifier que le timestamp n'est pas dans le futur
        if (timestamp > new Date()) {
            this.showError('Le pointage ne peut pas être dans le futur');
            return;
        }

        // Appeler le callback avec les données
        if (this.onAddEntry) {
            this.onAddEntry({
                type: typeValue,
                timestamp: timestamp
            });
        }

        // Fermer le modal
        this.hideAddEntryModal();
    }
}
