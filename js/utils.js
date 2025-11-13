'use strict';

/**
 * Fonctions utilitaires pour le Time Tracker
 */

/**
 * Formate une durée en millisecondes en format lisible (heures et minutes)
 * @param {number} milliseconds - Durée en millisecondes
 * @returns {string} Format "Xh YYm"
 * @example
 * formatDuration(28800000) // "8h 00m"
 * formatDuration(27000000) // "7h 30m"
 */
export function formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) {
        return '0h 00m';
    }

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Formate un objet Date en heure locale (HH:MM)
 * @param {Date} date - Date à formater
 * @returns {string} Format "HH:MM"
 * @example
 * formatTime(new Date('2025-11-13T09:00:00')) // "09:00"
 */
export function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '--:--';
    }

    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formate un objet Date en date locale (YYYY-MM-DD)
 * @param {Date} date - Date à formater
 * @returns {string} Format "YYYY-MM-DD"
 * @example
 * formatDate(new Date('2025-11-13T09:00:00')) // "2025-11-13"
 */
export function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().split('T')[0];
}

/**
 * Retourne la date du jour au format YYYY-MM-DD
 * @returns {string} Date du jour
 */
export function getTodayDateString() {
    return formatDate(new Date());
}

/**
 * Convertit un type de pointage en libellé français
 * @param {string} type - Type de pointage (clock-in, lunch-start, lunch-end, clock-out)
 * @returns {string} Libellé en français
 */
export function getEntryTypeLabel(type) {
    const labels = {
        'clock-in': 'Arrivée',
        'lunch-start': 'Début pause',
        'lunch-end': 'Fin pause',
        'clock-out': 'Départ'
    };

    return labels[type] || type;
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
export function escapeHtml(str) {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Crée un élément DOM avec des attributs
 * @param {string} tag - Tag HTML
 * @param {Object} attributes - Attributs de l'élément
 * @param {string|HTMLElement|Array} children - Contenu ou enfants
 * @returns {HTMLElement} Élément créé
 * @example
 * createElement('button', { class: 'btn', id: 'myBtn' }, 'Click me')
 */
export function createElement(tag, attributes = {}, children = null) {
    const element = document.createElement(tag);

    // Ajouter les attributs
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });

    // Ajouter les enfants
    if (children) {
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof HTMLElement) {
            element.appendChild(children);
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
    }

    return element;
}
