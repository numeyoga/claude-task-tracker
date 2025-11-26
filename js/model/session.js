'use strict';

import { formatDate } from '../utils.js';

/**
 * ProjectSession - Type immutable pour les sessions de projet
 * Toutes les fonctions retournent de nouveaux objets
 */
export const ProjectSession = Object.freeze({
    /**
     * Crée une nouvelle session de projet (immutable)
     * @param {string} projectId - ID du projet
     * @param {Date} startTime - Heure de début (défaut: maintenant)
     * @returns {Object} Session immutable
     * @throws {Error} Si projectId est vide
     */
    create: (projectId, startTime = new Date()) => {
        if (!projectId || projectId.trim() === '') {
            throw new Error('Le projectId ne peut pas être vide');
        }

        if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
            throw new Error('startTime doit être un objet Date valide');
        }

        return Object.freeze({
            id: crypto.randomUUID(),
            projectId,
            startTime,
            endTime: null,
            date: formatDate(startTime)
        });
    },

    /**
     * Arrête une session
     * Retourne une NOUVELLE session (pas de mutation)
     * @param {Object} session - Session existante
     * @param {Date} endTime - Heure de fin (défaut: maintenant)
     * @returns {Object} Nouvelle session avec endTime défini
     * @throws {Error} Si la session est déjà terminée
     */
    stop: (session, endTime = new Date()) => {
        if (session.endTime !== null) {
            throw new Error('La session est déjà terminée');
        }

        if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
            throw new Error('endTime doit être un objet Date valide');
        }

        if (endTime < session.startTime) {
            throw new Error('endTime ne peut pas être avant startTime');
        }

        return Object.freeze({
            ...session,
            endTime
        });
    },

    /**
     * Vérifie si une session est en cours
     * @param {Object} session - Session
     * @returns {boolean} true si en cours
     */
    isRunning: (session) => session.endTime === null,

    /**
     * Vérifie si une session est terminée
     * @param {Object} session - Session
     * @returns {boolean} true si terminée
     */
    isFinished: (session) => session.endTime !== null,

    /**
     * Calcule la durée d'une session en millisecondes
     * @param {Object} session - Session
     * @returns {number} Durée en ms
     */
    getDuration: (session) => {
        const end = session.endTime || new Date();
        return end.getTime() - session.startTime.getTime();
    },

    /**
     * Met à jour l'heure de début d'une session
     * @param {Object} session - Session existante
     * @param {Date} newStartTime - Nouvelle heure de début
     * @returns {Object} Nouvelle session avec startTime mis à jour
     */
    updateStartTime: (session, newStartTime) => {
        if (!(newStartTime instanceof Date) || isNaN(newStartTime.getTime())) {
            throw new Error('newStartTime doit être un objet Date valide');
        }

        if (session.endTime && newStartTime >= session.endTime) {
            throw new Error('startTime doit être avant endTime');
        }

        return Object.freeze({
            ...session,
            startTime: newStartTime,
            date: formatDate(newStartTime)
        });
    },

    /**
     * Met à jour l'heure de fin d'une session
     * @param {Object} session - Session existante
     * @param {Date} newEndTime - Nouvelle heure de fin
     * @returns {Object} Nouvelle session avec endTime mis à jour
     */
    updateEndTime: (session, newEndTime) => {
        if (newEndTime !== null) {
            if (!(newEndTime instanceof Date) || isNaN(newEndTime.getTime())) {
                throw new Error('newEndTime doit être un objet Date valide ou null');
            }

            if (newEndTime < session.startTime) {
                throw new Error('endTime ne peut pas être avant startTime');
            }
        }

        return Object.freeze({
            ...session,
            endTime: newEndTime
        });
    },

    /**
     * Convertit une session en objet JSON pour stockage
     * @param {Object} session - Session
     * @returns {Object} Objet JSON
     */
    toJSON: (session) => ({
        id: session.id,
        projectId: session.projectId,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime ? session.endTime.toISOString() : null,
        date: session.date
    }),

    /**
     * Crée une session à partir d'un objet JSON
     * @param {Object} data - Données JSON
     * @returns {Object} Session immutable
     */
    fromJSON: (data) => {
        if (!data || typeof data !== 'object') {
            throw new Error('Données JSON invalides');
        }

        const session = Object.freeze({
            id: data.id,
            projectId: data.projectId,
            startTime: new Date(data.startTime),
            endTime: data.endTime ? new Date(data.endTime) : null,
            date: data.date
        });

        return session;
    },

    /**
     * Compare deux sessions par heure de début (plus récent en premier)
     * @param {Object} a - Première session
     * @param {Object} b - Deuxième session
     * @returns {number} -1, 0, ou 1
     */
    compareByStartTime: (a, b) =>
        b.startTime.getTime() - a.startTime.getTime(),

    /**
     * Compare deux sessions par heure de début (plus ancien en premier)
     * @param {Object} a - Première session
     * @param {Object} b - Deuxième session
     * @returns {number} -1, 0, ou 1
     */
    compareByStartTimeAsc: (a, b) =>
        a.startTime.getTime() - b.startTime.getTime(),

    /**
     * Compare deux sessions par durée (plus long en premier)
     * @param {Object} a - Première session
     * @param {Object} b - Deuxième session
     * @returns {number} -1, 0, ou 1
     */
    compareByDuration: (a, b) =>
        ProjectSession.getDuration(b) - ProjectSession.getDuration(a),

    /**
     * Filtre les sessions par projet
     * @param {string} projectId - ID du projet
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Sessions du projet
     */
    filterByProject: (projectId, sessions) =>
        sessions.filter(session => session.projectId === projectId),

    /**
     * Filtre les sessions par date
     * @param {string} date - Date au format YYYY-MM-DD
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Sessions de la date
     */
    filterByDate: (date, sessions) =>
        sessions.filter(session => session.date === date),

    /**
     * Filtre les sessions en cours
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Sessions en cours
     */
    filterRunning: (sessions) =>
        sessions.filter(ProjectSession.isRunning),

    /**
     * Filtre les sessions terminées
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Sessions terminées
     */
    filterFinished: (sessions) =>
        sessions.filter(ProjectSession.isFinished),

    /**
     * Cherche une session par ID
     * @param {string} id - ID de la session
     * @param {Array} sessions - Liste de sessions
     * @returns {Object|null} Session trouvée ou null
     */
    findById: (id, sessions) =>
        sessions.find(session => session.id === id) || null,

    /**
     * Trouve la session en cours (s'il y en a une)
     * @param {Array} sessions - Liste de sessions
     * @returns {Object|null} Session en cours ou null
     */
    findRunning: (sessions) =>
        sessions.find(ProjectSession.isRunning) || null,

    /**
     * Calcule le temps total de plusieurs sessions
     * @param {Array} sessions - Liste de sessions
     * @param {boolean} includeRunning - Inclure les sessions en cours (défaut: true)
     * @returns {number} Durée totale en ms
     */
    calculateTotalTime: (sessions, includeRunning = true) => {
        return sessions
            .filter(session => includeRunning || ProjectSession.isFinished(session))
            .reduce((total, session) => total + ProjectSession.getDuration(session), 0);
    },

    /**
     * Trie les sessions par heure de début (plus récent en premier)
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Nouveau tableau trié
     */
    sortByStartTime: (sessions) =>
        [...sessions].sort(ProjectSession.compareByStartTime),

    /**
     * Trie les sessions par heure de début (plus ancien en premier)
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Nouveau tableau trié
     */
    sortByStartTimeAsc: (sessions) =>
        [...sessions].sort(ProjectSession.compareByStartTimeAsc),

    /**
     * Trie les sessions par durée (plus long en premier)
     * @param {Array} sessions - Liste de sessions
     * @returns {Array} Nouveau tableau trié
     */
    sortByDuration: (sessions) =>
        [...sessions].sort(ProjectSession.compareByDuration)
});
