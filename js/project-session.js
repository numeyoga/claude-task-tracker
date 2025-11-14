'use strict';

/**
 * Classe représentant une session de travail sur un projet
 */
export class ProjectSession {
    /**
     * @param {string} projectId - ID du projet
     * @param {Date} startTime - Date/heure de début de la session
     * @param {Date|null} endTime - Date/heure de fin de la session (null si en cours)
     */
    constructor(projectId, startTime = new Date(), endTime = null) {
        this.id = this.#generateId();
        this.projectId = projectId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.date = this.#getDateString(startTime);
    }

    /**
     * Génère un ID unique pour la session
     * @returns {string}
     * @private
     */
    #generateId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Extrait la date au format YYYY-MM-DD
     * @param {Date} date - Date à formater
     * @returns {string}
     * @private
     */
    #getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Calcule la durée de la session
     * @returns {number} Durée en millisecondes
     */
    getDuration() {
        if (!this.endTime) {
            // Session en cours: calculer jusqu'à maintenant
            return Date.now() - this.startTime.getTime();
        }

        return this.endTime.getTime() - this.startTime.getTime();
    }

    /**
     * Termine la session
     * @param {Date} endTime - Date/heure de fin (par défaut: maintenant)
     */
    stop(endTime = new Date()) {
        if (this.endTime) {
            throw new Error('La session est déjà terminée');
        }

        if (endTime < this.startTime) {
            throw new Error('La date de fin ne peut pas être avant la date de début');
        }

        this.endTime = endTime;
    }

    /**
     * Vérifie si la session est en cours
     * @returns {boolean}
     */
    isRunning() {
        return this.endTime === null;
    }

    /**
     * Convertit la session en objet JSON pour le stockage
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            projectId: this.projectId,
            startTime: this.startTime.toISOString(),
            endTime: this.endTime ? this.endTime.toISOString() : null,
            duration: this.getDuration(),
            date: this.date
        };
    }

    /**
     * Crée une session à partir de données JSON
     * @param {Object} data - Données JSON
     * @returns {ProjectSession}
     */
    static fromJSON(data) {
        const session = Object.create(ProjectSession.prototype);
        session.id = data.id;
        session.projectId = data.projectId;
        session.startTime = new Date(data.startTime);
        session.endTime = data.endTime ? new Date(data.endTime) : null;
        session.date = data.date;
        return session;
    }
}
