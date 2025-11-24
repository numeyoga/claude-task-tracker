'use strict';

import { ENTRY_TYPES, isBreakStart, isBreakEnd } from './time-entry.js';
import { formatTime } from './utils.js';

/**
 * Classe pour gérer l'affichage de la ligne de temps de la journée
 */
export class DayTimeline {
    constructor() {
        this.elements = {};
        this.currentDayData = null;
    }

    /**
     * Initialise les éléments du DOM
     */
    init() {
        this.elements.container = document.getElementById('day-timeline-content');
        this.elements.detailsBtn = document.getElementById('timeline-details-btn');
        this.elements.modal = document.getElementById('day-details-modal');
        this.elements.modalOverlay = this.elements.modal?.querySelector('.modal__overlay');
        this.elements.closeModalBtn = document.getElementById('close-day-modal-btn');
        this.elements.detailsList = document.getElementById('day-details-list');

        this.#setupEventListeners();
    }

    /**
     * Configure les écouteurs d'événements
     * @private
     */
    #setupEventListeners() {
        // Bouton pour ouvrir la modal de détails
        this.elements.detailsBtn?.addEventListener('click', () => {
            this.#showDayDetails();
        });

        // Fermer la modal
        this.elements.closeModalBtn?.addEventListener('click', () => {
            this.#closeDayDetails();
        });

        this.elements.modalOverlay?.addEventListener('click', () => {
            this.#closeDayDetails();
        });
    }

    /**
     * Met à jour la ligne de temps avec les données du jour
     * @param {Object[]} entries - Pointages du jour
     * @param {Object[]} sessions - Sessions de projet du jour
     * @param {Object[]} projects - Liste des projets
     */
    update(entries, sessions, projects) {
        if (!this.elements.container) return;

        // Sauvegarder les données pour les détails
        this.currentDayData = { entries, sessions, projects };

        // Vérifier s'il y a des données (pointages OU sessions)
        if ((!entries || entries.length === 0) && (!sessions || sessions.length === 0)) {
            this.elements.container.innerHTML = '<p class="day-timeline__empty">Aucun pointage pour aujourd\'hui</p>';
            return;
        }

        // Trouver l'heure de début et de fin
        const { startTime, endTime } = this.#getTimeRange(entries, sessions);

        if (!startTime) {
            this.elements.container.innerHTML = '<p class="day-timeline__empty">Aucun pointage pour aujourd\'hui</p>';
            return;
        }

        // Créer la ligne de temps
        this.#renderTimeline(startTime, endTime, entries, sessions, projects);
    }

    /**
     * Détermine les bornes de temps pour la journée
     * @param {Object[]} entries - Pointages du jour
     * @param {Object[]} sessions - Sessions de projet du jour
     * @returns {Object} { startTime, endTime }
     * @private
     */
    #getTimeRange(entries, sessions) {
        let startTime = null;
        let endTime = null;

        // Priorité 1 : Trouver le pointage d'arrivée (CLOCK_IN)
        const clockInEntry = entries?.find(e => e.type === ENTRY_TYPES.CLOCK_IN);

        if (clockInEntry) {
            startTime = new Date(clockInEntry.timestamp);
        } else if (sessions && sessions.length > 0) {
            // Priorité 2 : Si pas de CLOCK_IN, utiliser la première session
            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
            startTime = new Date(sortedSessions[0].startTime);
        } else if (entries && entries.length > 0) {
            // Priorité 3 : Si pas de sessions, utiliser le premier pointage
            const sortedEntries = [...entries].sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            startTime = new Date(sortedEntries[0].timestamp);
        }

        // Si toujours pas de startTime, retourner null
        if (!startTime) {
            return { startTime: null, endTime: null };
        }

        // Trouver le pointage de départ (CLOCK_OUT)
        const clockOutEntry = entries?.find(e => e.type === ENTRY_TYPES.CLOCK_OUT);

        if (clockOutEntry) {
            endTime = new Date(clockOutEntry.timestamp);
        } else if (sessions && sessions.length > 0) {
            // Si pas de CLOCK_OUT, chercher la dernière session terminée
            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );
            const lastSession = sortedSessions[0];

            if (lastSession.endTime) {
                // Si la dernière session est terminée, utiliser son heure de fin
                const lastSessionEnd = new Date(lastSession.endTime);
                // Utiliser au moins 18h00 ou l'heure de fin de session
                endTime = new Date(startTime);
                endTime.setHours(18, 0, 0, 0);
                if (lastSessionEnd > endTime) {
                    endTime = lastSessionEnd;
                }
            } else {
                // Session en cours, utiliser l'heure actuelle ou 18h00
                const now = new Date();
                endTime = new Date(startTime);
                endTime.setHours(18, 0, 0, 0);
                if (now > endTime) {
                    endTime = now;
                }
            }
        } else {
            // Utiliser 18h00 du même jour
            endTime = new Date(startTime);
            endTime.setHours(18, 0, 0, 0);
        }

        return { startTime, endTime };
    }

    /**
     * Rend la ligne de temps
     * @param {Date} startTime - Heure de début
     * @param {Date} endTime - Heure de fin
     * @param {Object[]} entries - Pointages
     * @param {Object[]} sessions - Sessions de projet
     * @param {Object[]} projects - Projets
     * @private
     */
    #renderTimeline(startTime, endTime, entries, sessions, projects) {
        // Calculer la durée totale en minutes
        const totalDuration = (endTime - startTime) / (1000 * 60);

        // Construire les segments
        const segments = this.#buildSegments(startTime, endTime, entries, sessions, projects);

        // Créer le HTML
        const html = `
            <div class="day-timeline__bar">
                ${segments.map(segment => this.#renderSegment(segment, startTime, totalDuration)).join('')}
            </div>
            <div class="day-timeline__labels">
                <span>${formatTime(startTime)}</span>
                <span>${formatTime(endTime)}</span>
            </div>
        `;

        this.elements.container.innerHTML = html;
    }

    /**
     * Construit les segments de la ligne de temps
     * @param {Date} startTime - Heure de début
     * @param {Date} endTime - Heure de fin
     * @param {Object[]} entries - Pointages
     * @param {Object[]} sessions - Sessions de projet
     * @param {Object[]} projects - Projets
     * @returns {Object[]} Segments
     * @private
     */
    #buildSegments(startTime, endTime, entries, sessions, projects) {
        const segments = [];
        const timeline = [];

        // Ajouter toutes les activités avec leur type
        // Ajouter les pauses
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        let currentBreakStart = null;
        sortedEntries.forEach(entry => {
            if (isBreakStart(entry.type)) {
                currentBreakStart = new Date(entry.timestamp);
            } else if (isBreakEnd(entry.type) && currentBreakStart) {
                timeline.push({
                    type: 'break',
                    start: currentBreakStart,
                    end: new Date(entry.timestamp),
                    label: 'Pause'
                });
                currentBreakStart = null;
            }
        });

        // Si une pause est encore en cours
        if (currentBreakStart) {
            timeline.push({
                type: 'break',
                start: currentBreakStart,
                end: new Date(), // Pause en cours
                label: 'Pause (en cours)'
            });
        }

        // Ajouter les sessions de projet
        sessions.forEach(session => {
            const project = projects.find(p => p.id === session.projectId);
            const sessionStart = new Date(session.startTime);
            const sessionEnd = session.endTime ? new Date(session.endTime) : new Date();

            timeline.push({
                type: 'project',
                start: sessionStart,
                end: sessionEnd,
                label: project?.name || 'Projet inconnu',
                projectId: session.projectId
            });
        });

        // Trier par heure de début
        timeline.sort((a, b) => a.start - b.start);

        // Remplir les trous avec des segments "idle"
        let currentTime = startTime;
        timeline.forEach(item => {
            // S'il y a un trou avant cet item
            if (item.start > currentTime) {
                segments.push({
                    type: 'idle',
                    start: currentTime,
                    end: item.start,
                    label: 'Inactif'
                });
            }

            // Ajouter l'item
            segments.push(item);
            currentTime = item.end > currentTime ? item.end : currentTime;
        });

        // S'il reste du temps après la dernière activité
        if (currentTime < endTime) {
            segments.push({
                type: 'idle',
                start: currentTime,
                end: endTime,
                label: 'Inactif'
            });
        }

        return segments;
    }

    /**
     * Rend un segment de la ligne de temps
     * @param {Object} segment - Segment à rendre
     * @param {Date} startTime - Heure de début de la journée
     * @param {number} totalDuration - Durée totale en minutes
     * @returns {string} HTML du segment
     * @private
     */
    #renderSegment(segment, startTime, totalDuration) {
        const segmentStart = (segment.start - startTime) / (1000 * 60);
        const segmentDuration = (segment.end - segment.start) / (1000 * 60);

        const leftPercent = (segmentStart / totalDuration) * 100;
        const widthPercent = (segmentDuration / totalDuration) * 100;

        // Ne pas afficher les segments trop petits (moins de 1%)
        if (widthPercent < 1) return '';

        const duration = this.#formatDuration(segmentDuration);
        const tooltip = `${segment.label}\n${formatTime(segment.start)} - ${formatTime(segment.end)}\n${duration}`;

        return `
            <div class="day-timeline__segment day-timeline__segment--${segment.type}"
                 style="left: ${leftPercent}%; width: ${widthPercent}%;"
                 title="${tooltip}">
                <div class="day-timeline__tooltip">
                    ${segment.label}<br>
                    ${formatTime(segment.start)} - ${formatTime(segment.end)}<br>
                    ${duration}
                </div>
                ${widthPercent > 8 ? `<span class="day-timeline__segment-label">${segment.label}</span>` : ''}
            </div>
        `;
    }

    /**
     * Formate une durée en minutes
     * @param {number} minutes - Durée en minutes
     * @returns {string} Durée formatée
     * @private
     */
    #formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);

        if (hours > 0) {
            return `${hours}h ${mins.toString().padStart(2, '0')}m`;
        }
        return `${mins}m`;
    }

    /**
     * Affiche la modal avec les détails de la journée
     * @private
     */
    #showDayDetails() {
        if (!this.currentDayData || !this.elements.modal) return;

        const { entries, sessions, projects } = this.currentDayData;

        // Créer le contenu de la modal
        const html = this.#renderDayDetails(entries, sessions, projects);
        this.elements.detailsList.innerHTML = html;

        // Afficher la modal
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Ferme la modal de détails
     * @private
     */
    #closeDayDetails() {
        if (!this.elements.modal) return;

        this.elements.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * Rend le détail textuel de la journée
     * @param {Object[]} entries - Pointages
     * @param {Object[]} sessions - Sessions de projet
     * @param {Object[]} projects - Projets
     * @returns {string} HTML du détail
     * @private
     */
    #renderDayDetails(entries, sessions, projects) {
        if (!entries || entries.length === 0) {
            return '<div class="day-details-list__empty">Aucune activité pour aujourd\'hui</div>';
        }

        // Combiner toutes les activités avec leur timestamp
        const timeline = [];

        // Ajouter les pointages
        entries.forEach(entry => {
            const type = this.#getEntryTypeLabel(entry.type);
            timeline.push({
                time: new Date(entry.timestamp),
                type: 'entry',
                label: type,
                subtype: entry.type
            });
        });

        // Ajouter les sessions
        sessions.forEach(session => {
            const project = projects.find(p => p.id === session.projectId);
            const duration = this.#formatDuration((new Date(session.endTime || new Date()) - new Date(session.startTime)) / (1000 * 60));

            timeline.push({
                time: new Date(session.startTime),
                type: 'session',
                label: `Début session: ${project?.name || 'Projet inconnu'}`,
                duration: duration
            });

            if (session.endTime) {
                timeline.push({
                    time: new Date(session.endTime),
                    type: 'session',
                    label: `Fin session: ${project?.name || 'Projet inconnu'}`,
                    duration: null
                });
            }
        });

        // Trier par ordre chronologique
        timeline.sort((a, b) => a.time - b.time);

        // Générer le HTML
        return timeline.map(item => {
            const className = item.type === 'entry' ?
                (isBreakStart(item.subtype) || isBreakEnd(item.subtype) ? 'day-details-item--break' : 'day-details-item--entry') :
                'day-details-item--session';

            return `
                <div class="day-details-item ${className}">
                    <div class="day-details-item__time">${formatTime(item.time)}</div>
                    <div class="day-details-item__label">${item.label}</div>
                    ${item.duration ? `<div class="day-details-item__duration">Durée: ${item.duration}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Obtient le libellé d'un type de pointage
     * @param {string} type - Type de pointage
     * @returns {string} Libellé
     * @private
     */
    #getEntryTypeLabel(type) {
        const labels = {
            [ENTRY_TYPES.CLOCK_IN]: '🟢 Arrivée',
            [ENTRY_TYPES.CLOCK_OUT]: '🔴 Départ',
            [ENTRY_TYPES.BREAK_START]: '⏸️ Début de pause',
            [ENTRY_TYPES.BREAK_END]: '▶️ Fin de pause',
            [ENTRY_TYPES.LUNCH_START]: '⏸️ Début de pause',
            [ENTRY_TYPES.LUNCH_END]: '▶️ Fin de pause'
        };
        return labels[type] || type;
    }
}
