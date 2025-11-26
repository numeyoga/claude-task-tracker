'use strict';

import { getTodayDateString } from '../utils.js';

/**
 * État global de l'application - Immutable
 * C'est la source unique de vérité pour toute l'application
 */

/**
 * État initial de l'application
 * Toutes les modifications doivent passer par la fonction update
 */
export const initialModel = Object.freeze({
    // ===== Données métier =====

    /**
     * Liste de toutes les entrées de pointage
     * @type {Array<TimeEntry>}
     */
    entries: [],

    /**
     * Liste de tous les projets
     * @type {Array<Project>}
     */
    projects: [],

    /**
     * Liste de toutes les sessions de projet
     * @type {Array<ProjectSession>}
     */
    sessions: [],

    /**
     * Session de projet en cours (si une est active)
     * @type {ProjectSession|null}
     */
    currentSession: null,

    // ===== État UI =====

    /**
     * Vue actuellement affichée
     * @type {'tracker' | 'projects' | 'reports' | 'entries' | 'sessions'}
     */
    currentView: 'tracker',

    /**
     * Date sélectionnée (pour le tracker et les rapports)
     * @type {string} Format YYYY-MM-DD
     */
    selectedDate: getTodayDateString(),

    /**
     * Boutons de pointage activés
     * @type {Array<string>}
     */
    enabledButtons: ['clock-in'],

    /**
     * Indique si l'application est en train de charger des données
     * @type {boolean}
     */
    isLoading: false,

    /**
     * Message d'erreur à afficher (null si pas d'erreur)
     * @type {string|null}
     */
    errorMessage: null,

    /**
     * Message de succès à afficher (null si pas de message)
     * @type {string|null}
     */
    successMessage: null,

    // ===== Données calculées pour la page tracker =====

    /**
     * Temps de présence du jour (en millisecondes)
     * @type {number}
     */
    presenceTime: 0,

    /**
     * Pourcentage de l'objectif de 8h atteint
     * @type {number}
     */
    presencePercentage: 0,

    /**
     * Temps restant pour atteindre 8h (en millisecondes)
     * @type {number}
     */
    remainingTime: 28800000, // 8 heures en ms

    /**
     * Statut du jour
     * @type {'not-started' | 'morning' | 'lunch' | 'afternoon' | 'completed'}
     */
    dayStatus: 'not-started',

    /**
     * Durée totale des pauses du jour (en millisecondes)
     * @type {number}
     */
    breaksDuration: 0,

    // ===== État des rapports =====

    /**
     * Type de période pour les rapports
     * @type {'week' | 'month' | 'custom'}
     */
    reportPeriodType: 'week',

    /**
     * Date de début de la période de rapport
     * @type {string|null} Format YYYY-MM-DD
     */
    reportPeriodStart: null,

    /**
     * Date de fin de la période de rapport
     * @type {string|null} Format YYYY-MM-DD
     */
    reportPeriodEnd: null,

    /**
     * Données du rapport calculées
     * @type {Object|null}
     */
    reportData: null,

    // ===== État des projets =====

    /**
     * Statistiques des projets (temps par projet, etc.)
     * @type {Array|null}
     */
    projectStats: null,

    /**
     * ID du projet sélectionné pour édition
     * @type {string|null}
     */
    selectedProjectId: null,

    // ===== État des popovers/modaux =====

    /**
     * Popover actuellement ouvert
     * @type {string|null} 'add-project' | 'edit-session' | 'add-retroactive' | etc.
     */
    openPopover: null,

    /**
     * Données du popover (contexte)
     * @type {Object|null}
     */
    popoverData: null,

    // ===== Timer =====

    /**
     * Temps écoulé pour la session en cours (mis à jour chaque seconde)
     * @type {number} Millisecondes
     */
    timerElapsed: 0,

    // ===== Filtres et tri =====

    /**
     * Filtre pour la liste des entrées
     * @type {Object}
     */
    entriesFilter: Object.freeze({
        dateStart: null,
        dateEnd: null,
        type: null
    }),

    /**
     * Tri pour la liste des entrées
     * @type {'date-desc' | 'date-asc' | 'type'}
     */
    entriesSort: 'date-desc',

    /**
     * Filtre pour la liste des sessions
     * @type {Object}
     */
    sessionsFilter: Object.freeze({
        projectId: null,
        dateStart: null,
        dateEnd: null
    }),

    /**
     * Tri pour la liste des sessions
     * @type {'date-desc' | 'date-asc' | 'duration'}
     */
    sessionsSort: 'date-desc'
});

/**
 * Sélecteurs - Fonctions pures pour extraire des données dérivées du modèle
 * Ces fonctions ne modifient jamais le modèle
 */
export const selectors = Object.freeze({
    /**
     * Obtient les entrées du jour sélectionné
     * @param {Object} model - Modèle
     * @returns {Array} Entrées du jour
     */
    getTodayEntries: (model) =>
        model.entries.filter(entry => entry.date === model.selectedDate),

    /**
     * Obtient les sessions du jour sélectionné
     * @param {Object} model - Modèle
     * @returns {Array} Sessions du jour
     */
    getTodaySessions: (model) =>
        model.sessions.filter(session => session.date === model.selectedDate),

    /**
     * Obtient les projets actifs
     * @param {Object} model - Modèle
     * @returns {Array} Projets actifs
     */
    getActiveProjects: (model) =>
        model.projects.filter(project => project.active),

    /**
     * Vérifie si un timer est actif
     * @param {Object} model - Modèle
     * @returns {boolean}
     */
    isTimerRunning: (model) =>
        model.currentSession !== null,

    /**
     * Obtient le projet de la session en cours
     * @param {Object} model - Modèle
     * @returns {Object|null} Projet ou null
     */
    getCurrentProject: (model) => {
        if (!model.currentSession) return null;
        return model.projects.find(p => p.id === model.currentSession.projectId) || null;
    },

    /**
     * Vérifie si l'objectif de 8h est atteint
     * @param {Object} model - Modèle
     * @returns {boolean}
     */
    isWorkDayComplete: (model) =>
        model.presencePercentage >= 100,

    /**
     * Vérifie si la journée a commencé (au moins un clock-in)
     * @param {Object} model - Modèle
     * @returns {boolean}
     */
    hasDayStarted: (model) =>
        model.dayStatus !== 'not-started',

    /**
     * Vérifie si un popover est ouvert
     * @param {Object} model - Modèle
     * @returns {boolean}
     */
    isPopoverOpen: (model) =>
        model.openPopover !== null
});
