'use strict';

/**
 * Project - Type immutable pour les projets
 * Toutes les fonctions retournent de nouveaux objets
 */
export const Project = Object.freeze({
    /**
     * Crée un nouveau projet (immutable)
     * @param {string} name - Nom du projet
     * @param {number} timeSpent - Temps passé en ms (défaut: 0)
     * @returns {Object} Projet immutable
     * @throws {Error} Si le nom est vide
     */
    create: (name, timeSpent = 0) => {
        if (!name || name.trim() === '') {
            throw new Error('Le nom du projet ne peut pas être vide');
        }

        if (timeSpent < 0) {
            throw new Error('Le temps ne peut pas être négatif');
        }

        return Object.freeze({
            id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            timeSpent,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    },

    /**
     * Met à jour le nom d'un projet
     * Retourne un NOUVEAU projet (pas de mutation)
     * @param {Object} project - Projet existant
     * @param {string} newName - Nouveau nom
     * @returns {Object} Nouveau projet avec nom mis à jour
     */
    updateName: (project, newName) => {
        if (!newName || newName.trim() === '') {
            throw new Error('Le nom du projet ne peut pas être vide');
        }

        return Object.freeze({
            ...project,
            name: newName.trim(),
            updatedAt: new Date()
        });
    },

    /**
     * Met à jour le temps passé sur un projet
     * @param {Object} project - Projet existant
     * @param {number} timeSpent - Nouveau temps en ms
     * @returns {Object} Nouveau projet avec temps mis à jour
     */
    setTimeSpent: (project, timeSpent) => {
        if (timeSpent < 0) {
            throw new Error('Le temps ne peut pas être négatif');
        }

        return Object.freeze({
            ...project,
            timeSpent,
            updatedAt: new Date()
        });
    },

    /**
     * Ajoute du temps au projet
     * @param {Object} project - Projet existant
     * @param {number} duration - Durée à ajouter en ms
     * @returns {Object} Nouveau projet avec temps augmenté
     */
    addTime: (project, duration) => {
        if (duration < 0) {
            throw new Error('La durée ne peut pas être négative');
        }

        return Object.freeze({
            ...project,
            timeSpent: project.timeSpent + duration,
            updatedAt: new Date()
        });
    },

    /**
     * Désactive un projet (soft delete)
     * @param {Object} project - Projet existant
     * @returns {Object} Nouveau projet désactivé
     */
    deactivate: (project) =>
        Object.freeze({
            ...project,
            active: false,
            updatedAt: new Date()
        }),

    /**
     * Réactive un projet
     * @param {Object} project - Projet existant
     * @returns {Object} Nouveau projet activé
     */
    activate: (project) =>
        Object.freeze({
            ...project,
            active: true,
            updatedAt: new Date()
        }),

    /**
     * Convertit un projet en objet JSON pour stockage
     * @param {Object} project - Projet
     * @returns {Object} Objet JSON
     */
    toJSON: (project) => ({
        id: project.id,
        name: project.name,
        timeSpent: project.timeSpent,
        active: project.active,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
    }),

    /**
     * Crée un projet à partir d'un objet JSON
     * @param {Object} data - Données JSON
     * @returns {Object} Projet immutable
     */
    fromJSON: (data) => {
        if (!data || typeof data !== 'object') {
            throw new Error('Données JSON invalides');
        }

        return Object.freeze({
            id: data.id,
            name: data.name,
            timeSpent: data.timeSpent || 0,
            active: data.active !== undefined ? data.active : true,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    },

    /**
     * Compare deux projets par date de création (plus récent en premier)
     * @param {Object} a - Premier projet
     * @param {Object} b - Deuxième projet
     * @returns {number} -1, 0, ou 1
     */
    compareByCreatedAt: (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime(),

    /**
     * Compare deux projets par nom (ordre alphabétique)
     * @param {Object} a - Premier projet
     * @param {Object} b - Deuxième projet
     * @returns {number} -1, 0, ou 1
     */
    compareByName: (a, b) =>
        a.name.localeCompare(b.name),

    /**
     * Compare deux projets par temps passé (décroissant)
     * @param {Object} a - Premier projet
     * @param {Object} b - Deuxième projet
     * @returns {number} -1, 0, ou 1
     */
    compareByTimeSpent: (a, b) =>
        b.timeSpent - a.timeSpent,

    /**
     * Filtre les projets actifs
     * @param {Array} projects - Liste de projets
     * @returns {Array} Projets actifs
     */
    filterActive: (projects) =>
        projects.filter(project => project.active),

    /**
     * Filtre les projets inactifs
     * @param {Array} projects - Liste de projets
     * @returns {Array} Projets inactifs
     */
    filterInactive: (projects) =>
        projects.filter(project => !project.active),

    /**
     * Cherche un projet par ID
     * @param {string} id - ID du projet
     * @param {Array} projects - Liste de projets
     * @returns {Object|null} Projet trouvé ou null
     */
    findById: (id, projects) =>
        projects.find(project => project.id === id) || null,

    /**
     * Cherche un projet par nom
     * @param {string} name - Nom du projet
     * @param {Array} projects - Liste de projets
     * @returns {Object|null} Projet trouvé ou null
     */
    findByName: (name, projects) =>
        projects.find(project =>
            project.name.toLowerCase() === name.toLowerCase()
        ) || null,

    /**
     * Trie les projets par date de création
     * @param {Array} projects - Liste de projets
     * @returns {Array} Nouveau tableau trié
     */
    sortByCreatedAt: (projects) =>
        [...projects].sort(Project.compareByCreatedAt),

    /**
     * Trie les projets par nom
     * @param {Array} projects - Liste de projets
     * @returns {Array} Nouveau tableau trié
     */
    sortByName: (projects) =>
        [...projects].sort(Project.compareByName),

    /**
     * Trie les projets par temps passé
     * @param {Array} projects - Liste de projets
     * @returns {Array} Nouveau tableau trié
     */
    sortByTimeSpent: (projects) =>
        [...projects].sort(Project.compareByTimeSpent)
});
