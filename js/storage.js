'use strict';

import { TimeEntry } from './time-entry.js';
import { Project } from './project.js';
import { ProjectSession } from './project-session.js';

/**
 * Configuration de la base de données
 */
const DB_NAME = 'TimeTrackerDB';
const DB_VERSION = 1;

const STORES = {
    TIME_ENTRIES: 'timeEntries',
    PROJECTS: 'projects',
    PROJECT_SESSIONS: 'projectSessions'
};

/**
 * Service de gestion du stockage IndexedDB
 */
export class StorageService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialise la base de données
     * @returns {Promise<void>}
     * @throws {Error} Si l'initialisation échoue
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Erreur lors de l\'ouverture de la base de données'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ Base de données initialisée');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Créer le store pour les pointages (timeEntries)
                if (!db.objectStoreNames.contains(STORES.TIME_ENTRIES)) {
                    const timeEntriesStore = db.createObjectStore(STORES.TIME_ENTRIES, {
                        keyPath: 'id'
                    });

                    // Index pour filtrer par date
                    timeEntriesStore.createIndex('date', 'date', { unique: false });

                    // Index pour trier par timestamp
                    timeEntriesStore.createIndex('timestamp', 'timestamp', { unique: false });

                    console.log('✅ Store timeEntries créé');
                }

                // Créer le store pour les projets (projects)
                if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
                    const projectsStore = db.createObjectStore(STORES.PROJECTS, {
                        keyPath: 'id'
                    });

                    projectsStore.createIndex('name', 'name', { unique: false });
                    projectsStore.createIndex('active', 'active', { unique: false });

                    console.log('✅ Store projects créé');
                }

                // Créer le store pour les sessions de projet (projectSessions)
                if (!db.objectStoreNames.contains(STORES.PROJECT_SESSIONS)) {
                    const sessionsStore = db.createObjectStore(STORES.PROJECT_SESSIONS, {
                        keyPath: 'id'
                    });

                    sessionsStore.createIndex('projectId', 'projectId', { unique: false });
                    sessionsStore.createIndex('date', 'date', { unique: false });
                    sessionsStore.createIndex('startTime', 'startTime', { unique: false });

                    console.log('✅ Store projectSessions créé');
                }
            };
        });
    }

    // ======================
    // Méthodes publiques - TimeEntries
    // ======================

    /**
     * Sauvegarde une entrée de pointage
     * @param {TimeEntry} entry - Entrée à sauvegarder
     * @returns {Promise<string>} ID de l'entrée sauvegardée
     * @throws {Error} Si la sauvegarde échoue
     */
    async saveEntry(entry) {
        if (!(entry instanceof TimeEntry)) {
            throw new Error('L\'entrée doit être une instance de TimeEntry');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.TIME_ENTRIES], 'readwrite');
            const store = transaction.objectStore(STORES.TIME_ENTRIES);

            const data = entry.toJSON();
            const request = store.put(data);

            request.onsuccess = () => {
                console.log('✅ Entrée sauvegardée:', entry.type, entry.timestamp);
                resolve(entry.id);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la sauvegarde de l\'entrée'));
            };
        });
    }

    /**
     * Récupère toutes les entrées d'un jour donné
     * @param {string} date - Date au format YYYY-MM-DD
     * @returns {Promise<TimeEntry[]>} Liste des entrées triées par timestamp
     * @throws {Error} Si la récupération échoue
     */
    async getEntriesByDate(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.TIME_ENTRIES], 'readonly');
            const store = transaction.objectStore(STORES.TIME_ENTRIES);
            const index = store.index('date');

            const request = index.getAll(date);

            request.onsuccess = () => {
                const entries = request.result.map(data => TimeEntry.fromJSON(data));

                // Trier par timestamp croissant
                entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                resolve(entries);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération des entrées'));
            };
        });
    }

    /**
     * Récupère une entrée par son ID
     * @param {string} id - ID de l'entrée
     * @returns {Promise<TimeEntry|null>} Entrée trouvée ou null
     * @throws {Error} Si la récupération échoue
     */
    async getEntryById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.TIME_ENTRIES], 'readonly');
            const store = transaction.objectStore(STORES.TIME_ENTRIES);

            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(TimeEntry.fromJSON(request.result));
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération de l\'entrée'));
            };
        });
    }

    /**
     * Supprime une entrée par son ID
     * @param {string} id - ID de l'entrée à supprimer
     * @returns {Promise<void>}
     * @throws {Error} Si la suppression échoue
     */
    async deleteEntry(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.TIME_ENTRIES], 'readwrite');
            const store = transaction.objectStore(STORES.TIME_ENTRIES);

            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('✅ Entrée supprimée:', id);
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la suppression de l\'entrée'));
            };
        });
    }

    /**
     * Récupère toutes les entrées de la base de données
     * @returns {Promise<TimeEntry[]>} Liste de toutes les entrées
     * @throws {Error} Si la récupération échoue
     */
    async getAllEntries() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.TIME_ENTRIES], 'readonly');
            const store = transaction.objectStore(STORES.TIME_ENTRIES);

            const request = store.getAll();

            request.onsuccess = () => {
                const entries = request.result.map(data => TimeEntry.fromJSON(data));

                // Trier par timestamp décroissant (plus récent en premier)
                entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                resolve(entries);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération de toutes les entrées'));
            };
        });
    }

    /**
     * Supprime toutes les données de la base (pour les tests)
     * @returns {Promise<void>}
     * @throws {Error} Si la suppression échoue
     */
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [STORES.TIME_ENTRIES, STORES.PROJECTS, STORES.PROJECT_SESSIONS],
                'readwrite'
            );

            const clearPromises = [];

            Object.values(STORES).forEach(storeName => {
                const store = transaction.objectStore(storeName);
                clearPromises.push(
                    new Promise((res, rej) => {
                        const request = store.clear();
                        request.onsuccess = () => res();
                        request.onerror = () => rej();
                    })
                );
            });

            Promise.all(clearPromises)
                .then(() => {
                    console.log('✅ Toutes les données ont été supprimées');
                    resolve();
                })
                .catch(() => {
                    reject(new Error('Erreur lors de la suppression des données'));
                });
        });
    }

    // ======================
    // Méthodes publiques - Projects
    // ======================

    /**
     * Sauvegarde un projet
     * @param {Project} project - Projet à sauvegarder
     * @returns {Promise<string>} ID du projet sauvegardé
     * @throws {Error} Si la sauvegarde échoue
     */
    async saveProject(project) {
        if (!(project instanceof Project)) {
            throw new Error('Le projet doit être une instance de Project');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECTS], 'readwrite');
            const store = transaction.objectStore(STORES.PROJECTS);

            const data = project.toJSON();
            const request = store.put(data);

            request.onsuccess = () => {
                console.log('✅ Projet sauvegardé:', project.name);
                resolve(project.id);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la sauvegarde du projet'));
            };
        });
    }

    /**
     * Récupère tous les projets actifs
     * @returns {Promise<Project[]>} Liste des projets
     * @throws {Error} Si la récupération échoue
     */
    async getAllProjects() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECTS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECTS);

            const request = store.getAll();

            request.onsuccess = () => {
                const projects = request.result
                    .map(data => Project.fromJSON(data))
                    .filter(project => project.active);

                // Trier par date de création (plus récent en premier)
                projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                resolve(projects);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération des projets'));
            };
        });
    }

    /**
     * Récupère un projet par son ID
     * @param {string} id - ID du projet
     * @returns {Promise<Project|null>} Projet trouvé ou null
     * @throws {Error} Si la récupération échoue
     */
    async getProjectById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECTS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECTS);

            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(Project.fromJSON(request.result));
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération du projet'));
            };
        });
    }

    /**
     * Supprime un projet (marque comme inactif)
     * @param {string} id - ID du projet à supprimer
     * @returns {Promise<void>}
     * @throws {Error} Si la suppression échoue
     */
    async deleteProject(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const project = await this.getProjectById(id);
                if (!project) {
                    reject(new Error('Projet non trouvé'));
                    return;
                }

                project.active = false;
                project.updatedAt = new Date();

                const transaction = this.db.transaction([STORES.PROJECTS], 'readwrite');
                const store = transaction.objectStore(STORES.PROJECTS);

                const request = store.put(project.toJSON());

                request.onsuccess = () => {
                    console.log('✅ Projet supprimé:', id);
                    resolve();
                };

                request.onerror = () => {
                    reject(new Error('Erreur lors de la suppression du projet'));
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // ======================
    // Méthodes publiques - ProjectSessions
    // ======================

    /**
     * Sauvegarde une session de projet
     * @param {ProjectSession} session - Session à sauvegarder
     * @returns {Promise<string>} ID de la session sauvegardée
     * @throws {Error} Si la sauvegarde échoue
     */
    async saveSession(session) {
        if (!(session instanceof ProjectSession)) {
            throw new Error('La session doit être une instance de ProjectSession');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readwrite');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

            const data = session.toJSON();
            const request = store.put(data);

            request.onsuccess = () => {
                console.log('✅ Session sauvegardée:', session.id);
                resolve(session.id);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la sauvegarde de la session'));
            };
        });
    }

    /**
     * Récupère toutes les sessions d'un projet
     * @param {string} projectId - ID du projet
     * @returns {Promise<ProjectSession[]>} Liste des sessions
     * @throws {Error} Si la récupération échoue
     */
    async getSessionsByProject(projectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);
            const index = store.index('projectId');

            const request = index.getAll(projectId);

            request.onsuccess = () => {
                const sessions = request.result.map(data => ProjectSession.fromJSON(data));

                // Trier par date de début (plus récent en premier)
                sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

                resolve(sessions);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération des sessions'));
            };
        });
    }

    /**
     * Récupère toutes les sessions d'un jour donné
     * @param {string} date - Date au format YYYY-MM-DD
     * @returns {Promise<ProjectSession[]>} Liste des sessions
     * @throws {Error} Si la récupération échoue
     */
    async getSessionsByDate(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);
            const index = store.index('date');

            const request = index.getAll(date);

            request.onsuccess = () => {
                const sessions = request.result.map(data => ProjectSession.fromJSON(data));

                // Trier par date de début (plus ancien en premier)
                sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

                resolve(sessions);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération des sessions'));
            };
        });
    }

    /**
     * Récupère une session par son ID
     * @param {string} id - ID de la session
     * @returns {Promise<ProjectSession|null>} Session trouvée ou null
     * @throws {Error} Si la récupération échoue
     */
    async getSessionById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(ProjectSession.fromJSON(request.result));
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération de la session'));
            };
        });
    }

    /**
     * Récupère la session en cours (non terminée) s'il y en a une
     * @returns {Promise<ProjectSession|null>} Session en cours ou null
     * @throws {Error} Si la récupération échoue
     */
    async getCurrentSession() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

            const request = store.getAll();

            request.onsuccess = () => {
                const sessions = request.result
                    .map(data => ProjectSession.fromJSON(data))
                    .filter(session => session.isRunning());

                // Il ne devrait y avoir qu'une seule session en cours
                if (sessions.length > 0) {
                    resolve(sessions[0]);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération de la session en cours'));
            };
        });
    }

    /**
     * Supprime une session par son ID
     * @param {string} id - ID de la session à supprimer
     * @returns {Promise<void>}
     * @throws {Error} Si la suppression échoue
     */
    async deleteSession(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readwrite');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('✅ Session supprimée:', id);
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la suppression de la session'));
            };
        });
    }

    /**
     * Récupère toutes les sessions de projet
     * @returns {Promise<ProjectSession[]>} Liste de toutes les sessions
     * @throws {Error} Si la récupération échoue
     */
    async getAllSessions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
            const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

            const request = store.getAll();

            request.onsuccess = () => {
                const sessions = request.result.map(data => ProjectSession.fromJSON(data));

                // Trier par date de début (plus récent en premier)
                sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

                resolve(sessions);
            };

            request.onerror = () => {
                reject(new Error('Erreur lors de la récupération de toutes les sessions'));
            };
        });
    }
}
