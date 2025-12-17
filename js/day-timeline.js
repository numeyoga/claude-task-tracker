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
        // Collecter les pauses
        const breaks = this.#collectBreaks(entries);

        // Collecter les sessions de projet avec leurs infos
        const projectSessions = this.#collectProjectSessions(sessions, projects);

        // Construire les segments avec détection des chevauchements
        const segments = this.#buildSegmentsWithOverlaps(startTime, endTime, breaks, projectSessions);

        return segments;
    }

    /**
     * Collecte les pauses à partir des pointages
     * @param {Object[]} entries - Pointages
     * @returns {Object[]} Liste des pauses
     * @private
     */
    #collectBreaks(entries) {
        const breaks = [];
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        let currentBreakStart = null;
        sortedEntries.forEach(entry => {
            if (isBreakStart(entry.type)) {
                currentBreakStart = new Date(entry.timestamp);
            } else if (isBreakEnd(entry.type) && currentBreakStart) {
                breaks.push({
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
            breaks.push({
                type: 'break',
                start: currentBreakStart,
                end: new Date(),
                label: 'Pause (en cours)'
            });
        }

        return breaks;
    }

    /**
     * Collecte les sessions de projet
     * @param {Object[]} sessions - Sessions
     * @param {Object[]} projects - Projets
     * @returns {Object[]} Sessions avec infos projet
     * @private
     */
    #collectProjectSessions(sessions, projects) {
        return sessions.map(session => {
            const project = projects.find(p => p.id === session.projectId);
            return {
                start: new Date(session.startTime),
                end: session.endTime ? new Date(session.endTime) : new Date(),
                projectId: session.projectId,
                projectName: project?.name || 'Projet inconnu',
                projectColor: project?.color || '#3b82f6'
            };
        });
    }

    /**
     * Construit les segments avec détection des chevauchements multi-projets
     * @param {Date} startTime - Heure de début
     * @param {Date} endTime - Heure de fin
     * @param {Object[]} breaks - Pauses
     * @param {Object[]} projectSessions - Sessions de projet
     * @returns {Object[]} Segments
     * @private
     */
    #buildSegmentsWithOverlaps(startTime, endTime, breaks, projectSessions) {
        // Collecter tous les points de temps importants
        const timePoints = new Set();
        timePoints.add(startTime.getTime());
        timePoints.add(endTime.getTime());

        // Ajouter les débuts/fins de pauses
        breaks.forEach(b => {
            timePoints.add(b.start.getTime());
            timePoints.add(b.end.getTime());
        });

        // Ajouter les débuts/fins de sessions
        projectSessions.forEach(s => {
            timePoints.add(s.start.getTime());
            timePoints.add(s.end.getTime());
        });

        // Trier les points de temps
        const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);

        // Construire les segments entre chaque paire de points
        const segments = [];
        for (let i = 0; i < sortedTimes.length - 1; i++) {
            const segStart = new Date(sortedTimes[i]);
            const segEnd = new Date(sortedTimes[i + 1]);

            // Ignorer les segments de durée nulle
            if (segStart.getTime() === segEnd.getTime()) continue;

            // Vérifier si c'est une pause
            const isBreak = breaks.some(b =>
                segStart >= b.start && segEnd <= b.end
            );

            if (isBreak) {
                const breakInfo = breaks.find(b => segStart >= b.start && segEnd <= b.end);
                segments.push({
                    type: 'break',
                    start: segStart,
                    end: segEnd,
                    label: breakInfo?.label || 'Pause'
                });
                continue;
            }

            // Trouver les projets actifs pendant ce segment
            const activeProjects = projectSessions.filter(s =>
                segStart >= s.start && segEnd <= s.end
            );

            if (activeProjects.length === 0) {
                // Aucun projet actif = inactif
                segments.push({
                    type: 'idle',
                    start: segStart,
                    end: segEnd,
                    label: 'Inactif'
                });
            } else if (activeProjects.length === 1) {
                // Un seul projet
                segments.push({
                    type: 'project',
                    start: segStart,
                    end: segEnd,
                    label: activeProjects[0].projectName,
                    projectId: activeProjects[0].projectId,
                    projectColor: activeProjects[0].projectColor
                });
            } else {
                // Multi-projets !
                segments.push({
                    type: 'multiproject',
                    start: segStart,
                    end: segEnd,
                    label: `${activeProjects.length} projets`,
                    projects: activeProjects.map(p => ({
                        id: p.projectId,
                        name: p.projectName,
                        color: p.projectColor
                    }))
                });
            }
        }

        // Fusionner les segments adjacents du même type
        return this.#mergeAdjacentSegments(segments);
    }

    /**
     * Fusionne les segments adjacents identiques
     * @param {Object[]} segments - Segments à fusionner
     * @returns {Object[]} Segments fusionnés
     * @private
     */
    #mergeAdjacentSegments(segments) {
        if (segments.length === 0) return segments;

        const merged = [];
        let current = { ...segments[0] };

        for (let i = 1; i < segments.length; i++) {
            const next = segments[i];
            const canMerge = this.#canMergeSegments(current, next);

            if (canMerge) {
                // Étendre le segment courant
                current.end = next.end;
            } else {
                // Sauvegarder et commencer un nouveau segment
                merged.push(current);
                current = { ...next };
            }
        }

        // Ne pas oublier le dernier segment
        merged.push(current);

        return merged;
    }

    /**
     * Vérifie si deux segments peuvent être fusionnés
     * @param {Object} seg1 - Premier segment
     * @param {Object} seg2 - Deuxième segment
     * @returns {boolean} Peut être fusionné
     * @private
     */
    #canMergeSegments(seg1, seg2) {
        // Même type requis
        if (seg1.type !== seg2.type) return false;

        // Pour les projets simples, même projet requis
        if (seg1.type === 'project') {
            return seg1.projectId === seg2.projectId;
        }

        // Pour les multi-projets, mêmes projets requis
        if (seg1.type === 'multiproject') {
            if (seg1.projects.length !== seg2.projects.length) return false;
            const ids1 = seg1.projects.map(p => p.id).sort();
            const ids2 = seg2.projects.map(p => p.id).sort();
            return ids1.every((id, idx) => id === ids2[idx]);
        }

        // Pour idle et break, toujours fusionnable
        return true;
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

        // Générer le contenu du tooltip selon le type de segment
        const tooltipContent = this.#renderTooltipContent(segment, duration);

        // Style personnalisé pour les projets
        const customStyle = this.#getSegmentStyle(segment);

        return `
            <div class="day-timeline__segment day-timeline__segment--${segment.type}"
                 style="left: ${leftPercent}%; width: ${widthPercent}%;${customStyle}">
                <div class="day-timeline__tooltip${segment.type === 'multiproject' ? ' day-timeline__tooltip--multiproject' : ''}">
                    ${tooltipContent}
                </div>
                ${widthPercent > 8 ? `<span class="day-timeline__segment-label">${segment.label}</span>` : ''}
            </div>
        `;
    }

    /**
     * Génère le contenu du tooltip selon le type de segment
     * @param {Object} segment - Segment
     * @param {string} duration - Durée formatée
     * @returns {string} HTML du tooltip
     * @private
     */
    #renderTooltipContent(segment, duration) {
        const timeRange = `${formatTime(segment.start)} - ${formatTime(segment.end)}`;

        if (segment.type === 'multiproject') {
            // Tooltip enrichi pour multi-projets
            const projectsList = segment.projects.map(p =>
                `<span class="day-timeline__tooltip-project">
                    <span class="day-timeline__tooltip-project-dot" style="background-color: ${p.color};"></span>
                    ${p.name}
                </span>`
            ).join('');

            return `
                <div class="day-timeline__tooltip-header">
                    <span class="day-timeline__tooltip-icon">⚡</span>
                    <strong>${segment.projects.length} projets en parallèle</strong>
                </div>
                <div class="day-timeline__tooltip-projects">
                    ${projectsList}
                </div>
                <div class="day-timeline__tooltip-time">
                    ${timeRange}
                </div>
                <div class="day-timeline__tooltip-duration">
                    ${duration}
                </div>
            `;
        }

        // Tooltip standard pour les autres types
        return `
            ${segment.label}<br>
            ${timeRange}<br>
            ${duration}
        `;
    }

    /**
     * Génère le style personnalisé pour un segment
     * @param {Object} segment - Segment
     * @returns {string} Style inline
     * @private
     */
    #getSegmentStyle(segment) {
        if (segment.type === 'project' && segment.projectColor) {
            return ` --project-color: ${segment.projectColor};`;
        }

        if (segment.type === 'multiproject' && segment.projects) {
            // Créer un dégradé avec les couleurs des projets
            const colors = segment.projects.map(p => p.color);
            if (colors.length === 2) {
                return ` --gradient: linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 50%, ${colors[1]} 50%, ${colors[1]} 100%);`;
            } else if (colors.length >= 3) {
                const step = 100 / colors.length;
                const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(', ');
                return ` --gradient: linear-gradient(135deg, ${stops});`;
            }
        }

        return '';
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
