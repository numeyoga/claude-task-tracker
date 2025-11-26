'use strict';

import { h } from '../core/vdom.js';
import {
    card,
    cardHeader,
    cardBody,
    button,
    primaryButton,
    dangerButton,
    secondaryButton,
    progressBar,
    badge,
    list,
    listItem,
    icon,
    flexContainer,
    spacer
} from './common.js';
import { formatDuration, formatTime, getEntryTypeLabel } from '../utils.js';
import { ENTRY_TYPES } from '../model/entry.js';

/**
 * Composant Tracker - Vue de pointage quotidienne
 * @param {Object} model - État global
 * @param {Function} dispatch - Fonction de dispatch
 * @returns {VNode}
 */
export const renderTracker = (model, dispatch) => {
    return h('div', { class: 'tracker' }, [
        // Barre de présence quotidienne
        renderPresenceBar(model, dispatch),

        spacer('medium'),

        // Boutons de pointage
        renderClockingButtons(model, dispatch),

        spacer('medium'),

        // Timer de projet (si actif)
        model.currentSession
            ? renderProjectTimer(model, dispatch)
            : null,

        model.currentSession ? spacer('medium') : null,

        // Liste des entrées du jour
        renderTodayEntries(model, dispatch),

        spacer('medium'),

        // Timeline du jour
        renderDayTimeline(model, dispatch)
    ]);
};

/**
 * Rend la barre de présence quotidienne
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderPresenceBar = (model, dispatch) => {
    return card({ class: 'daily-presence' }, [
        cardHeader('Présence du jour'),
        cardBody([
            h('div', { class: 'daily-presence__stats' }, [
                // Temps de présence
                h('div', { class: 'stat' }, [
                    h('div', { class: 'stat__label' }, 'Temps de présence'),
                    h('div', { class: 'stat__value' }, formatDuration(model.presenceTime))
                ]),

                // Pourcentage
                h('div', { class: 'stat' }, [
                    h('div', { class: 'stat__label' }, 'Progression'),
                    h('div', { class: 'stat__value' }, `${model.presencePercentage}%`)
                ]),

                // Temps restant
                h('div', { class: 'stat' }, [
                    h('div', { class: 'stat__label' }, 'Temps restant'),
                    h('div', { class: 'stat__value' },
                        model.remainingTime > 0
                            ? formatDuration(model.remainingTime)
                            : 'Objectif atteint !'
                    )
                ])
            ]),

            spacer('small'),

            // Barre de progression
            progressBar(model.presencePercentage, {
                class: model.presencePercentage >= 100
                    ? 'progress-bar--complete'
                    : model.presencePercentage >= 90
                        ? 'progress-bar--warning'
                        : ''
            }),

            spacer('small'),

            // Statut du jour
            h('div', { class: 'daily-presence__status' }, [
                badge(getDayStatusLabel(model.dayStatus), getDayStatusType(model.dayStatus))
            ])
        ])
    ]);
};

/**
 * Rend les boutons de pointage
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderClockingButtons = (model, dispatch) => {
    return card({ class: 'clocking-buttons' }, [
        cardHeader('Pointage'),
        cardBody([
            flexContainer({ class: 'buttons-grid' }, [
                // Arrivée
                primaryButton({
                    disabled: !model.enabledButtons.includes(ENTRY_TYPES.CLOCK_IN),
                    onClick: () => dispatch({ type: 'CLOCK_IN' })
                }, [icon('🟢'), ' Arriver']),

                // Début pause
                secondaryButton({
                    disabled: !model.enabledButtons.includes(ENTRY_TYPES.BREAK_START),
                    onClick: () => dispatch({ type: 'BREAK_START' })
                }, [icon('☕'), ' Pause']),

                // Fin pause
                secondaryButton({
                    disabled: !model.enabledButtons.includes(ENTRY_TYPES.BREAK_END),
                    onClick: () => dispatch({ type: 'BREAK_END' })
                }, [icon('✅'), ' Reprendre']),

                // Départ
                dangerButton({
                    disabled: !model.enabledButtons.includes(ENTRY_TYPES.CLOCK_OUT),
                    onClick: () => dispatch({ type: 'CLOCK_OUT' })
                }, [icon('🔴'), ' Partir'])
            ])
        ])
    ]);
};

/**
 * Rend le timer de projet actif
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderProjectTimer = (model, dispatch) => {
    const project = model.projects.find(p => p.id === model.currentSession.projectId);
    const projectName = project ? project.name : 'Projet inconnu';

    return card({ class: 'project-timer project-timer--active' }, [
        cardHeader('Timer de projet'),
        cardBody([
            h('div', { class: 'project-timer__info' }, [
                h('div', { class: 'project-timer__name' }, projectName),
                h('div', { class: 'project-timer__duration' }, formatDuration(model.timerElapsed))
            ]),

            spacer('small'),

            flexContainer({ class: 'project-timer__actions' }, [
                dangerButton({
                    onClick: () => dispatch({ type: 'STOP_SESSION' })
                }, 'Arrêter'),

                secondaryButton({
                    onClick: () => dispatch({ type: 'SHOW_PROJECT_SELECTOR' })
                }, 'Changer de projet')
            ])
        ])
    ]);
};

/**
 * Rend la liste des entrées du jour
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderTodayEntries = (model, dispatch) => {
    const todayEntries = model.entries.filter(e => e.date === model.selectedDate);

    return card({ class: 'today-entries' }, [
        cardHeader('Pointages du jour'),
        cardBody([
            list(
                { class: 'entries-list', emptyMessage: 'Aucun pointage aujourd\'hui' },
                todayEntries,
                (entry) => renderEntryItem(entry, dispatch)
            )
        ])
    ]);
};

/**
 * Rend un item d'entrée
 * @param {Object} entry - Entrée
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderEntryItem = (entry, dispatch) => {
    return listItem({ class: `entry entry--${entry.type}` }, [
        h('span', { class: 'entry__icon' }, getEntryIcon(entry.type)),
        h('span', { class: 'entry__label' }, getEntryTypeLabel(entry.type)),
        h('span', { class: 'entry__time' }, formatTime(entry.timestamp)),
        h('span', { class: 'entry__actions' }, [
            button({
                class: 'btn--small',
                title: 'Modifier',
                onClick: () => dispatch({ type: 'EDIT_ENTRY', entryId: entry.id })
            }, '✏️'),
            button({
                class: 'btn--small',
                title: 'Supprimer',
                onClick: () => dispatch({ type: 'DELETE_ENTRY', entryId: entry.id })
            }, '🗑️')
        ])
    ]);
};

/**
 * Rend la timeline du jour (placeholder)
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderDayTimeline = (model, dispatch) => {
    return card({ class: 'day-timeline' }, [
        cardHeader('Timeline de la journée'),
        cardBody([
            h('div', { class: 'timeline-placeholder' }, [
                h('p', {}, 'Timeline visuelle à implémenter')
            ])
        ])
    ]);
};

// Helpers

/**
 * Obtient l'icône pour un type d'entrée
 * @param {string} type - Type d'entrée
 * @returns {string}
 */
const getEntryIcon = (type) => {
    const icons = {
        [ENTRY_TYPES.CLOCK_IN]: '🟢',
        [ENTRY_TYPES.BREAK_START]: '☕',
        [ENTRY_TYPES.LUNCH_START]: '🍽️',
        [ENTRY_TYPES.BREAK_END]: '✅',
        [ENTRY_TYPES.LUNCH_END]: '✅',
        [ENTRY_TYPES.CLOCK_OUT]: '🔴'
    };
    return icons[type] || '⏱️';
};

/**
 * Obtient le libellé d'un statut de jour
 * @param {string} status - Statut
 * @returns {string}
 */
const getDayStatusLabel = (status) => {
    const labels = {
        'not-started': 'Pas commencé',
        'morning': 'Matinée',
        'lunch': 'En pause',
        'afternoon': 'Après-midi',
        'completed': 'Terminé'
    };
    return labels[status] || status;
};

/**
 * Obtient le type de badge pour un statut
 * @param {string} status - Statut
 * @returns {string}
 */
const getDayStatusType = (status) => {
    const types = {
        'not-started': 'secondary',
        'morning': 'primary',
        'lunch': 'warning',
        'afternoon': 'primary',
        'completed': 'success'
    };
    return types[status] || 'primary';
};
