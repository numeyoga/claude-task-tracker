'use strict';

import { IO } from '../core/monads.js';
import { TimeEntry } from '../model/entry.js';
import { Project } from '../model/project.js';
import { ProjectSession } from '../model/session.js';

/**
 * Configuration de la base de données
 */
const DB_NAME = 'TimeTrackerDB';
const DB_VERSION = 1;

const STORES = Object.freeze({
    TIME_ENTRIES: 'timeEntries',
    PROJECTS: 'projects',
    PROJECT_SESSIONS: 'projectSessions'
});

/**
 * Fonctions pures de transformation (pas d'effets de bord)
 */

/**
 * Convertit une entrée en format de stockage
 * @param {Object} entry - TimeEntry
 * @returns {Object} Format pour IndexedDB
 */
const entryToStorageFormat = (entry) => ({
    id: entry.id,
    type: entry.type,
    timestamp: entry.timestamp.toISOString(),
    date: entry.date,
    note: entry.note
});

/**
 * Convertit un format de stockage en TimeEntry
 * @param {Object} data - Données IndexedDB
 * @returns {Object} TimeEntry immutable
 */
const storageFormatToEntry = (data) => {
    const entry = TimeEntry.create(
        data.type,
        new Date(data.timestamp),
        data.note
    );
    // Préserver l'ID original
    return Object.freeze({ ...entry, id: data.id });
};

/**
 * Convertit un projet en format de stockage
 * @param {Object} project - Project
 * @returns {Object} Format pour IndexedDB
 */
const projectToStorageFormat = (project) => ({
    id: project.id,
    name: project.name,
    timeSpent: project.timeSpent,
    active: project.active,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
});

/**
 * Convertit un format de stockage en Project
 * @param {Object} data - Données IndexedDB
 * @returns {Object} Project immutable
 */
const storageFormatToProject = (data) =>
    Project.fromJSON(data);

/**
 * Convertit une session en format de stockage
 * @param {Object} session - ProjectSession
 * @returns {Object} Format pour IndexedDB
 */
const sessionToStorageFormat = (session) => ({
    id: session.id,
    projectId: session.projectId,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime ? session.endTime.toISOString() : null,
    date: session.date
});

/**
 * Convertit un format de stockage en ProjectSession
 * @param {Object} data - Données IndexedDB
 * @returns {Object} ProjectSession immutable
 */
const storageFormatToSession = (data) =>
    ProjectSession.fromJSON(data);

/**
 * Crée les effets de stockage avec IO monad
 * Toutes les fonctions retournent des IO qui encapsulent les effets de bord
 *
 * @param {IDBDatabase} db - Instance de la base de données IndexedDB
 * @returns {Object} Objet avec toutes les fonctions d'effet
 */
export const createStorageEffects = (db) => {
    // ======================
    // Effets pour TimeEntries
    // ======================

    /**
     * Sauvegarde une entrée (effet de bord encapsulé)
     * @param {Object} entry - TimeEntry à sauvegarder
     * @returns {IO<string>} IO qui retourne l'ID de l'entrée
     */
    const saveEntry = (entry) => new IO(() => {
        const transaction = db.transaction([STORES.TIME_ENTRIES], 'readwrite');
        const store = transaction.objectStore(STORES.TIME_ENTRIES);
        const data = entryToStorageFormat(entry);

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => {
                console.log('✅ Entrée sauvegardée:', entry.type, entry.timestamp);
                resolve(entry.id);
            };
            request.onerror = () => reject(new Error('Erreur lors de la sauvegarde de l\'entrée'));
        });
    });

    /**
     * Récupère les entrées d'un jour (effet de bord encapsulé)
     * @param {string} date - Date au format YYYY-MM-DD
     * @returns {IO<Array>} IO qui retourne les entrées du jour
     */
    const getEntriesByDate = (date) => new IO(() => {
        const transaction = db.transaction([STORES.TIME_ENTRIES], 'readonly');
        const store = transaction.objectStore(STORES.TIME_ENTRIES);
        const index = store.index('date');

        return new Promise((resolve, reject) => {
            const request = index.getAll(date);
            request.onsuccess = () => {
                const entries = request.result
                    .map(storageFormatToEntry)
                    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                resolve(entries);
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération des entrées'));
        });
    });

    /**
     * Récupère toutes les entrées
     * @returns {IO<Array>} IO qui retourne toutes les entrées
     */
    const getAllEntries = () => new IO(() => {
        const transaction = db.transaction([STORES.TIME_ENTRIES], 'readonly');
        const store = transaction.objectStore(STORES.TIME_ENTRIES);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const entries = request.result
                    .map(storageFormatToEntry)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                resolve(entries);
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération de toutes les entrées'));
        });
    });

    /**
     * Supprime une entrée
     * @param {string} id - ID de l'entrée
     * @returns {IO<void>} IO qui supprime l'entrée
     */
    const deleteEntry = (id) => new IO(() => {
        const transaction = db.transaction([STORES.TIME_ENTRIES], 'readwrite');
        const store = transaction.objectStore(STORES.TIME_ENTRIES);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                console.log('✅ Entrée supprimée:', id);
                resolve();
            };
            request.onerror = () => reject(new Error('Erreur lors de la suppression de l\'entrée'));
        });
    });

    // ======================
    // Effets pour Projects
    // ======================

    /**
     * Sauvegarde un projet
     * @param {Object} project - Project à sauvegarder
     * @returns {IO<string>} IO qui retourne l'ID du projet
     */
    const saveProject = (project) => new IO(() => {
        const transaction = db.transaction([STORES.PROJECTS], 'readwrite');
        const store = transaction.objectStore(STORES.PROJECTS);
        const data = projectToStorageFormat(project);

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => {
                console.log('✅ Projet sauvegardé:', project.name);
                resolve(project.id);
            };
            request.onerror = () => reject(new Error('Erreur lors de la sauvegarde du projet'));
        });
    });

    /**
     * Récupère tous les projets actifs
     * @returns {IO<Array>} IO qui retourne les projets actifs
     */
    const getAllProjects = () => new IO(() => {
        const transaction = db.transaction([STORES.PROJECTS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECTS);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const projects = request.result
                    .map(storageFormatToProject)
                    .filter(project => project.active)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                resolve(projects);
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération des projets'));
        });
    });

    /**
     * Récupère un projet par ID
     * @param {string} id - ID du projet
     * @returns {IO<Object|null>} IO qui retourne le projet ou null
     */
    const getProjectById = (id) => new IO(() => {
        const transaction = db.transaction([STORES.PROJECTS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECTS);

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) {
                    resolve(storageFormatToProject(request.result));
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération du projet'));
        });
    });

    // ======================
    // Effets pour ProjectSessions
    // ======================

    /**
     * Sauvegarde une session
     * @param {Object} session - ProjectSession à sauvegarder
     * @returns {IO<string>} IO qui retourne l'ID de la session
     */
    const saveSession = (session) => new IO(() => {
        const transaction = db.transaction([STORES.PROJECT_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORES.PROJECT_SESSIONS);
        const data = sessionToStorageFormat(session);

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => {
                console.log('✅ Session sauvegardée:', session.id);
                resolve(session.id);
            };
            request.onerror = () => reject(new Error('Erreur lors de la sauvegarde de la session'));
        });
    });

    /**
     * Récupère les sessions d'un projet
     * @param {string} projectId - ID du projet
     * @returns {IO<Array>} IO qui retourne les sessions du projet
     */
    const getSessionsByProject = (projectId) => new IO(() => {
        const transaction = db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECT_SESSIONS);
        const index = store.index('projectId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(projectId);
            request.onsuccess = () => {
                const sessions = request.result
                    .map(storageFormatToSession)
                    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
                resolve(sessions);
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération des sessions'));
        });
    });

    /**
     * Récupère les sessions d'un jour
     * @param {string} date - Date au format YYYY-MM-DD
     * @returns {IO<Array>} IO qui retourne les sessions du jour
     */
    const getSessionsByDate = (date) => new IO(() => {
        const transaction = db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECT_SESSIONS);
        const index = store.index('date');

        return new Promise((resolve, reject) => {
            const request = index.getAll(date);
            request.onsuccess = () => {
                const sessions = request.result
                    .map(storageFormatToSession)
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                resolve(sessions);
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération des sessions'));
        });
    });

    /**
     * Récupère toutes les sessions
     * @returns {IO<Array>} IO qui retourne toutes les sessions
     */
    const getAllSessions = () => new IO(() => {
        const transaction = db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const sessions = request.result
                    .map(storageFormatToSession)
                    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
                resolve(sessions);
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération de toutes les sessions'));
        });
    });

    /**
     * Récupère la session en cours (non terminée)
     * @returns {IO<Object|null>} IO qui retourne la session en cours ou null
     */
    const getCurrentSession = () => new IO(() => {
        const transaction = db.transaction([STORES.PROJECT_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const sessions = request.result
                    .map(storageFormatToSession)
                    .filter(session => session.endTime === null);

                // Il ne devrait y avoir qu'une seule session en cours
                if (sessions.length > 0) {
                    resolve(sessions[0]);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(new Error('Erreur lors de la récupération de la session en cours'));
        });
    });

    /**
     * Supprime une session
     * @param {string} id - ID de la session
     * @returns {IO<void>} IO qui supprime la session
     */
    const deleteSession = (id) => new IO(() => {
        const transaction = db.transaction([STORES.PROJECT_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORES.PROJECT_SESSIONS);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                console.log('✅ Session supprimée:', id);
                resolve();
            };
            request.onerror = () => reject(new Error('Erreur lors de la suppression de la session'));
        });
    });

    // Retourner toutes les fonctions d'effet
    return Object.freeze({
        // TimeEntries
        saveEntry,
        getEntriesByDate,
        getAllEntries,
        deleteEntry,

        // Projects
        saveProject,
        getAllProjects,
        getProjectById,

        // ProjectSessions
        saveSession,
        getSessionsByProject,
        getSessionsByDate,
        getAllSessions,
        getCurrentSession,
        deleteSession
    });
};

/**
 * Initialise la base de données (effet de bord)
 * @returns {IO<IDBDatabase>} IO qui retourne l'instance de la DB
 */
export const initDatabase = () => new IO(() => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Erreur lors de l\'ouverture de la base de données'));
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('✅ Base de données initialisée');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Créer le store pour les pointages
            if (!db.objectStoreNames.contains(STORES.TIME_ENTRIES)) {
                const timeEntriesStore = db.createObjectStore(STORES.TIME_ENTRIES, {
                    keyPath: 'id'
                });
                timeEntriesStore.createIndex('date', 'date', { unique: false });
                timeEntriesStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('✅ Store timeEntries créé');
            }

            // Créer le store pour les projets
            if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
                const projectsStore = db.createObjectStore(STORES.PROJECTS, {
                    keyPath: 'id'
                });
                projectsStore.createIndex('name', 'name', { unique: false });
                projectsStore.createIndex('active', 'active', { unique: false });
                console.log('✅ Store projects créé');
            }

            // Créer le store pour les sessions
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
});
