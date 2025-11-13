'use strict';

import { formatDate } from './utils.js';

/**
 * Types de pointage valides
 */
export const ENTRY_TYPES = {
    CLOCK_IN: 'clock-in',
    LUNCH_START: 'lunch-start',
    LUNCH_END: 'lunch-end',
    CLOCK_OUT: 'clock-out'
};

/**
 * Classe représentant un pointage (arrivée, pause, départ)
 */
export class TimeEntry {
    /**
     * Crée une nouvelle entrée de pointage
     * @param {string} type - Type de pointage (clock-in, lunch-start, lunch-end, clock-out)
     * @param {Date} timestamp - Date et heure du pointage (par défaut: maintenant)
     * @param {string} note - Note optionnelle
     * @throws {Error} Si le type de pointage est invalide
     * @throws {Error} Si le timestamp n'est pas une Date valide
     */
    constructor(type, timestamp = new Date(), note = '') {
        this.#validateType(type);
        this.#validateTimestamp(timestamp);

        this.id = crypto.randomUUID();
        this.type = type;
        this.timestamp = timestamp;
        this.date = formatDate(timestamp);
        this.note = note;
    }

    /**
     * Valide le type de pointage
     * @param {string} type - Type à valider
     * @throws {Error} Si le type n'est pas valide
     * @private
     */
    #validateType(type) {
        const validTypes = Object.values(ENTRY_TYPES);
        if (!validTypes.includes(type)) {
            throw new Error(
                `Type de pointage invalide: ${type}. Types valides: ${validTypes.join(', ')}`
            );
        }
    }

    /**
     * Valide le timestamp
     * @param {Date} timestamp - Timestamp à valider
     * @throws {Error} Si le timestamp n'est pas une Date valide
     * @private
     */
    #validateTimestamp(timestamp) {
        if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
            throw new Error('Timestamp invalide: doit être un objet Date valide');
        }

        // Vérifier que le timestamp n'est pas dans le futur
        if (timestamp > new Date()) {
            throw new Error('Le timestamp ne peut pas être dans le futur');
        }
    }

    /**
     * Convertit l'entrée en objet sérialisable pour IndexedDB
     * @returns {Object} Objet sérialisé
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            timestamp: this.timestamp.toISOString(),
            date: this.date,
            note: this.note
        };
    }

    /**
     * Crée une TimeEntry à partir d'un objet JSON (depuis IndexedDB)
     * @param {Object} json - Objet JSON
     * @returns {TimeEntry} Instance de TimeEntry
     * @throws {Error} Si les données sont invalides
     */
    static fromJSON(json) {
        if (!json || typeof json !== 'object') {
            throw new Error('Données JSON invalides');
        }

        const entry = new TimeEntry(
            json.type,
            new Date(json.timestamp),
            json.note || ''
        );

        // Préserver l'ID original
        entry.id = json.id;

        return entry;
    }
}
