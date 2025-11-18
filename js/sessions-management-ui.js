'use strict';

import { formatDuration } from './utils.js';

/**
 * UI pour la gestion de toutes les sessions de projet
 */
export class SessionsManagementUI {
    constructor() {
        this.section = null;
        this.listContainer = null;
        this.closeBtn = null;
        this.infoElement = null;

        // Filtre de période
        this.periodFilter = null; // { startDate: Date, endDate: Date, label: string }

        // Callbacks
        this.onDeleteSession = null;
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

        this.setupEventListeners();

        console.log('✅ Sessions Management UI initialisée');
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
            this.infoElement.textContent = `Sessions de travail sur les projets pour la période : ${this.periodFilter.label}`;
        } else {
            this.infoElement.textContent = 'Toutes vos sessions de travail sur les projets dans l\'ordre antéchronologique (du plus récent au plus ancien).';
        }
    }

    /**
     * Affiche la section
     */
    show() {
        if (this.section) {
            this.section.classList.add('entries-management-section--visible');
            document.body.style.overflow = 'hidden'; // Empêche le scroll du body

            // Charger les sessions
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
     * Affiche toutes les sessions
     * @param {ProjectSession[]} sessions - Liste des sessions à afficher
     * @param {Map<string, string>} projectNames - Map des noms de projets par ID
     */
    renderAllSessions(sessions, projectNames) {
        if (!this.listContainer) return;

        // Vider le conteneur
        this.listContainer.innerHTML = '';

        // Appliquer le filtre de période si défini
        let filteredSessions = sessions;
        if (this.periodFilter) {
            filteredSessions = this.filterSessionsByPeriod(sessions, this.periodFilter.startDate, this.periodFilter.endDate);
        }

        if (filteredSessions.length === 0) {
            const message = this.periodFilter
                ? 'Aucune session de travail pour cette période'
                : 'Aucune session de travail enregistrée';
            this.listContainer.innerHTML = `
                <div class="all-entries-list__empty">
                    ${message}
                </div>
            `;
            return;
        }

        // Grouper les sessions par date
        const sessionsByDate = this.groupSessionsByDate(filteredSessions);

        // Créer les éléments pour chaque date
        Object.keys(sessionsByDate).forEach(date => {
            const dateGroup = this.createDateGroup(date, sessionsByDate[date], projectNames);
            this.listContainer.appendChild(dateGroup);
        });
    }

    /**
     * Filtre les sessions par période
     * @param {ProjectSession[]} sessions - Liste des sessions
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {ProjectSession[]} Sessions filtrées
     */
    filterSessionsByPeriod(sessions, startDate, endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate >= start && sessionDate <= end;
        });
    }

    /**
     * Groupe les sessions par date
     * @param {ProjectSession[]} sessions - Liste des sessions
     * @returns {Object} Sessions groupées par date
     */
    groupSessionsByDate(sessions) {
        const grouped = {};

        sessions.forEach(session => {
            if (!grouped[session.date]) {
                grouped[session.date] = [];
            }
            grouped[session.date].push(session);
        });

        return grouped;
    }

    /**
     * Crée un groupe de date avec ses sessions
     * @param {string} date - Date au format YYYY-MM-DD
     * @param {ProjectSession[]} sessions - Liste des sessions pour cette date
     * @param {Map<string, string>} projectNames - Map des noms de projets par ID
     * @returns {HTMLElement} Élément DOM du groupe
     */
    createDateGroup(date, sessions, projectNames) {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';

        // Header de la date
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-group__header';
        dateHeader.innerHTML = `
            <h3 class="date-group__title">${this.formatDateHeader(date)}</h3>
            <span class="date-group__count">${sessions.length} session(s)</span>
        `;
        dateGroup.appendChild(dateHeader);

        // Liste des sessions
        const sessionsList = document.createElement('div');
        sessionsList.className = 'date-group__entries';

        sessions.forEach(session => {
            const sessionElement = this.createSessionElement(session, projectNames);
            sessionsList.appendChild(sessionElement);
        });

        dateGroup.appendChild(sessionsList);

        return dateGroup;
    }

    /**
     * Crée un élément de session
     * @param {ProjectSession} session - Session à afficher
     * @param {Map<string, string>} projectNames - Map des noms de projets par ID
     * @returns {HTMLElement} Élément DOM de la session
     */
    createSessionElement(session, projectNames) {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'entry-item';
        sessionDiv.dataset.sessionId = session.id;

        const projectName = projectNames.get(session.projectId) || 'Projet inconnu';
        const duration = formatDuration(session.getTotalDuration());
        const startTime = this.formatTime(session.startTime);
        const endTime = session.endTime ? this.formatTime(session.endTime) : 'En cours';

        sessionDiv.innerHTML = `
            <div class="entry-item__left">
                <span class="entry-item__icon">⏱️</span>
                <div class="entry-item__info">
                    <span class="entry-item__label">${projectName}</span>
                    <span class="entry-item__time">${startTime} - ${endTime} (${duration})</span>
                </div>
            </div>
            <div class="entry-item__actions">
                <button class="entry-item__btn entry-item__btn--delete" data-action="delete" title="Supprimer">
                    🗑️
                </button>
            </div>
        `;

        // Ajouter l'écouteur d'événement pour la suppression
        const deleteBtn = sessionDiv.querySelector('[data-action="delete"]');

        if (deleteBtn && this.onDeleteSession) {
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer cette session de ${duration} sur "${projectName}" ?`)) {
                    this.onDeleteSession(session);
                }
            });
        }

        return sessionDiv;
    }

    /**
     * Formate une heure
     * @param {Date} date - Date à formater
     * @returns {string} Heure formatée
     */
    formatTime(date) {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
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
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur
     */
    showError(message) {
        if (!this.listContainer) return;

        this.listContainer.innerHTML = `
            <div class="all-entries-list__empty">
                ❌ ${message}
            </div>
        `;
    }
}
