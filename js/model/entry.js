'use strict';

import { formatDate } from '../utils.js';

/**
 * Types de pointage valides
 */
export const ENTRY_TYPES = Object.freeze({
    CLOCK_IN: 'clock-in',
    BREAK_START: 'break-start',
    BREAK_END: 'break-end',
    LUNCH_START: 'lunch-start', // Compatibilité
    LUNCH_END: 'lunch-end',     // Compatibilité
    CLOCK_OUT: 'clock-out'
});

/**
 * Vérifie si un type correspond à un début de pause
 * @param {string} type - Type de pointage
 * @returns {boolean}
 */
export const isBreakStart = (type) =>
    type === ENTRY_TYPES.BREAK_START || type === ENTRY_TYPES.LUNCH_START;

/**
 * Vérifie si un type correspond à une fin de pause
 * @param {string} type - Type de pointage
 * @returns {boolean}
 */
export const isBreakEnd = (type) =>
    type === ENTRY_TYPES.BREAK_END || type === ENTRY_TYPES.LUNCH_END;

/**
 * TimeEntry - Type immutable pour les pointages
 * Toutes les fonctions retournent de nouveaux objets (pas de mutation)
 */
export const TimeEntry = Object.freeze({
    /**
     * Crée une nouvelle entrée de pointage (immutable)
     * @param {string} type - Type de pointage
     * @param {Date} timestamp - Date et heure (défaut: maintenant)
     * @param {string} note - Note optionnelle
     * @returns {Object} Entrée de pointage immutable
     * @throws {Error} Si le type ou timestamp est invalide
     */
    create: (type, timestamp = new Date(), note = '') => {
        // Validation du type
        const validTypes = Object.values(ENTRY_TYPES);
        if (!validTypes.includes(type)) {
            throw new Error(
                `Type de pointage invalide: ${type}. Types valides: ${validTypes.join(', ')}`
            );
        }

        // Validation du timestamp
        if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
            throw new Error('Timestamp invalide: doit être un objet Date valide');
        }

        if (timestamp > new Date()) {
            throw new Error('Le timestamp ne peut pas être dans le futur');
        }

        // Créer l'objet immutable
        return Object.freeze({
            id: crypto.randomUUID(),
            type,
            timestamp,
            date: formatDate(timestamp),
            note: note || ''
        });
    },

    /**
     * Met à jour le timestamp d'une entrée
     * Retourne une NOUVELLE entrée (pas de mutation)
     * @param {Object} entry - Entrée existante
     * @param {Date} newTimestamp - Nouveau timestamp
     * @returns {Object} Nouvelle entrée avec timestamp mis à jour
     */
    updateTimestamp: (entry, newTimestamp) => {
        if (!(newTimestamp instanceof Date) || isNaN(newTimestamp.getTime())) {
            throw new Error('Timestamp invalide: doit être un objet Date valide');
        }

        if (newTimestamp > new Date()) {
            throw new Error('Le timestamp ne peut pas être dans le futur');
        }

        // Créer une nouvelle entrée avec le timestamp modifié
        return Object.freeze({
            ...entry,
            timestamp: newTimestamp,
            date: formatDate(newTimestamp)
        });
    },

    /**
     * Met à jour la note d'une entrée
     * @param {Object} entry - Entrée existante
     * @param {string} newNote - Nouvelle note
     * @returns {Object} Nouvelle entrée avec note mise à jour
     */
    updateNote: (entry, newNote) =>
        Object.freeze({
            ...entry,
            note: newNote || ''
        }),

    /**
     * Convertit une entrée en objet sérialisable pour IndexedDB
     * @param {Object} entry - Entrée
     * @returns {Object} Objet JSON
     */
    toJSON: (entry) => ({
        id: entry.id,
        type: entry.type,
        timestamp: entry.timestamp.toISOString(),
        date: entry.date,
        note: entry.note
    }),

    /**
     * Crée une entrée à partir d'un objet JSON (depuis IndexedDB)
     * @param {Object} json - Objet JSON
     * @returns {Object} Entrée immutable
     * @throws {Error} Si les données sont invalides
     */
    fromJSON: (json) => {
        if (!json || typeof json !== 'object') {
            throw new Error('Données JSON invalides');
        }

        const entry = TimeEntry.create(
            json.type,
            new Date(json.timestamp),
            json.note || ''
        );

        // Préserver l'ID original (ne pas générer un nouveau)
        return Object.freeze({
            ...entry,
            id: json.id
        });
    },

    /**
     * Compare deux entrées par timestamp (pour tri)
     * @param {Object} a - Première entrée
     * @param {Object} b - Deuxième entrée
     * @returns {number} -1, 0, ou 1
     */
    compareByTimestamp: (a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime(),

    /**
     * Compare deux entrées par timestamp (ordre décroissant)
     * @param {Object} a - Première entrée
     * @param {Object} b - Deuxième entrée
     * @returns {number} -1, 0, ou 1
     */
    compareByTimestampDesc: (a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime(),

    /**
     * Filtre les entrées par date
     * @param {string} date - Date au format YYYY-MM-DD
     * @param {Array} entries - Liste d'entrées
     * @returns {Array} Entrées filtrées
     */
    filterByDate: (date, entries) =>
        entries.filter(entry => entry.date === date),

    /**
     * Filtre les entrées par type
     * @param {string} type - Type de pointage
     * @param {Array} entries - Liste d'entrées
     * @returns {Array} Entrées filtrées
     */
    filterByType: (type, entries) =>
        entries.filter(entry => entry.type === type),

    /**
     * Trie les entrées par timestamp croissant
     * @param {Array} entries - Liste d'entrées
     * @returns {Array} Nouveau tableau trié
     */
    sortByTimestamp: (entries) =>
        [...entries].sort(TimeEntry.compareByTimestamp),

    /**
     * Trie les entrées par timestamp décroissant
     * @param {Array} entries - Liste d'entrées
     * @returns {Array} Nouveau tableau trié
     */
    sortByTimestampDesc: (entries) =>
        [...entries].sort(TimeEntry.compareByTimestampDesc)
});
