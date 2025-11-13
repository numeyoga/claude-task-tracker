'use strict';

import { TimeEntry } from './time-entry.js';

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
}
