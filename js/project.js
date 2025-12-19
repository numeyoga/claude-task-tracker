'use strict';

/**
 * Classe représentant un projet
 */
export class Project {
    /**
     * @param {string} name - Nom du projet
     * @param {number} timeSpent - Temps passé en millisecondes (par défaut 0)
     */
    constructor(name, timeSpent = 0) {
        this.id = this.#generateId();
        this.name = name;
        this.timeSpent = timeSpent; // en millisecondes
        this.active = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Génère un ID unique pour le projet
     * @returns {string}
     * @private
     */
    #generateId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Met à jour le nom du projet
     * @param {string} newName - Nouveau nom
     */
    updateName(newName) {
        if (!newName || newName.trim() === '') {
            throw new Error('Le nom du projet ne peut pas être vide');
        }
        this.name = newName.trim();
        this.updatedAt = new Date();
    }

    /**
     * Met à jour le temps passé sur le projet
     * @param {number} timeSpent - Nouveau temps en millisecondes
     */
    updateTimeSpent(timeSpent) {
        if (timeSpent < 0) {
            throw new Error('Le temps ne peut pas être négatif');
        }
        this.timeSpent = timeSpent;
        this.updatedAt = new Date();
    }

    /**
     * Ajoute du temps au projet
     * @param {number} duration - Durée à ajouter en millisecondes
     */
    addTime(duration) {
        if (duration < 0) {
            throw new Error('La durée ne peut pas être négative');
        }
        this.timeSpent += duration;
        this.updatedAt = new Date();
    }

    /**
     * Convertit le projet en objet JSON pour le stockage
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            timeSpent: this.timeSpent,
            active: this.active,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Crée un projet à partir de données JSON
     * @param {Object} data - Données JSON
     * @returns {Project}
     */
    static fromJSON(data) {
        const project = Object.create(Project.prototype);
        project.id = data.id;
        project.name = data.name;
        project.timeSpent = data.timeSpent || 0;
        project.active = data.active !== undefined ? data.active : true;
        project.createdAt = new Date(data.createdAt);
        project.updatedAt = new Date(data.updatedAt);
        return project;
    }
}
