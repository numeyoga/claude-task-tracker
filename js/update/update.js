'use strict';

import { TimeEntry } from '../model/entry.js';
import { ProjectSession } from '../model/session.js';
import {
    calculatePresenceTime,
    getCompletionPercentage,
    getRemainingTime,
    getDayStatus,
    getEnabledButtons,
    calculateBreaksDuration
} from '../logic/calculator.js';

/**
 * Fonction Update (pure) - Le cœur de l'architecture Elm
 * Prend un message et l'état actuel, retourne le nouvel état
 *
 * RÈGLES:
 * - PURE: Pas d'effets de bord
 * - IMMUTABLE: Retourne toujours un nouvel objet
 * - SYNCHRONE: Pas de async/await
 * - Les effets sont gérés par le runtime, pas ici
 *
 * @param {Object} msg - Message/Action
 * @param {Object} model - État actuel
 * @returns {Object} Nouvel état
 */
export const update = (msg, model) => {
    switch (msg.type) {
        // ===== Initialisation =====
        case 'INIT':
            return model;

        // ===== Pointage =====
        case 'CLOCK_IN': {
            const newEntry = TimeEntry.create('clock-in', new Date());
            const newEntries = [...model.entries, newEntry];
            return recalculatePresence({
                ...model,
                entries: newEntries
            });
        }

        case 'CLOCK_OUT': {
            const newEntry = TimeEntry.create('clock-out', new Date());
            const newEntries = [...model.entries, newEntry];
            return recalculatePresence({
                ...model,
                entries: newEntries
            });
        }

        case 'BREAK_START': {
            const newEntry = TimeEntry.create('break-start', new Date());
            const newEntries = [...model.entries, newEntry];
            return recalculatePresence({
                ...model,
                entries: newEntries
            });
        }

        case 'BREAK_END': {
            const newEntry = TimeEntry.create('break-end', new Date());
            const newEntries = [...model.entries, newEntry];
            return recalculatePresence({
                ...model,
                entries: newEntries
            });
        }

        // ===== Projets =====
        case 'START_SESSION': {
            const newSession = ProjectSession.create(msg.projectId, new Date());
            return {
                ...model,
                currentSession: newSession,
                sessions: [...model.sessions, newSession],
                timerElapsed: 0
            };
        }

        case 'STOP_SESSION': {
            if (!model.currentSession) return model;

            const stoppedSession = ProjectSession.stop(model.currentSession, new Date());
            const updatedSessions = model.sessions.map(s =>
                s.id === stoppedSession.id ? stoppedSession : s
            );

            return {
                ...model,
                currentSession: null,
                sessions: updatedSessions,
                timerElapsed: 0
            };
        }

        case 'SWITCH_PROJECT': {
            let updatedModel = model;

            // Arrêter la session en cours
            if (model.currentSession) {
                const stoppedSession = ProjectSession.stop(model.currentSession, new Date());
                const updatedSessions = model.sessions.map(s =>
                    s.id === stoppedSession.id ? stoppedSession : s
                );
                updatedModel = {
                    ...updatedModel,
                    sessions: updatedSessions
                };
            }

            // Démarrer nouvelle session
            const newSession = ProjectSession.create(msg.projectId, new Date());
            return {
                ...updatedModel,
                currentSession: newSession,
                sessions: [...updatedModel.sessions, newSession],
                timerElapsed: 0
            };
        }

        // ===== Navigation =====
        case 'CHANGE_VIEW': {
            return {
                ...model,
                currentView: msg.view
            };
        }

        case 'CHANGE_DATE': {
            return {
                ...model,
                selectedDate: msg.date
            };
        }

        // ===== Chargement des données =====
        case 'ENTRIES_LOADED': {
            return recalculatePresence({
                ...model,
                entries: msg.entries,
                isLoading: false
            });
        }

        case 'PROJECTS_LOADED': {
            return {
                ...model,
                projects: msg.projects,
                isLoading: false
            };
        }

        case 'SESSIONS_LOADED': {
            return {
                ...model,
                sessions: msg.sessions,
                isLoading: false
            };
        }

        case 'CURRENT_SESSION_LOADED': {
            return {
                ...model,
                currentSession: msg.session,
                timerElapsed: msg.session ? ProjectSession.getDuration(msg.session) : 0
            };
        }

        // ===== Timer =====
        case 'TIMER_TICK': {
            return {
                ...model,
                timerElapsed: msg.elapsed
            };
        }

        // ===== Gestion des entrées =====
        case 'DELETE_ENTRY': {
            const newEntries = model.entries.filter(e => e.id !== msg.entryId);
            return recalculatePresence({
                ...model,
                entries: newEntries
            });
        }

        case 'UPDATE_ENTRY': {
            const newEntries = model.entries.map(e =>
                e.id === msg.entryId
                    ? TimeEntry.updateTimestamp(e, msg.timestamp)
                    : e
            );
            return recalculatePresence({
                ...model,
                entries: newEntries
            });
        }

        // ===== Gestion des sessions =====
        case 'DELETE_SESSION': {
            const newSessions = model.sessions.filter(s => s.id !== msg.sessionId);
            return {
                ...model,
                sessions: newSessions
            };
        }

        case 'UPDATE_SESSION': {
            const newSessions = model.sessions.map(s =>
                s.id === msg.sessionId
                    ? ProjectSession.updateStartTime(
                        ProjectSession.updateEndTime(s, msg.endTime),
                        msg.startTime
                    )
                    : s
            );
            return {
                ...model,
                sessions: newSessions
            };
        }

        // ===== Popovers =====
        case 'SHOW_PROJECT_SELECTOR': {
            return {
                ...model,
                openPopover: 'project-selector'
            };
        }

        case 'SHOW_ADD_PROJECT': {
            return {
                ...model,
                openPopover: 'add-project'
            };
        }

        case 'SHOW_EDIT_ENTRY': {
            return {
                ...model,
                openPopover: 'edit-entry',
                popoverData: { entryId: msg.entryId }
            };
        }

        case 'SHOW_EDIT_SESSION': {
            return {
                ...model,
                openPopover: 'edit-session',
                popoverData: { sessionId: msg.sessionId }
            };
        }

        case 'CLOSE_POPOVER': {
            return {
                ...model,
                openPopover: null,
                popoverData: null
            };
        }

        // ===== Loading =====
        case 'SET_LOADING': {
            return {
                ...model,
                isLoading: msg.isLoading
            };
        }

        // ===== Messages =====
        case 'ERROR': {
            return {
                ...model,
                errorMessage: msg.message,
                successMessage: null
            };
        }

        case 'SUCCESS': {
            return {
                ...model,
                successMessage: msg.message,
                errorMessage: null
            };
        }

        case 'CLEAR_ERROR': {
            return {
                ...model,
                errorMessage: null
            };
        }

        case 'CLEAR_SUCCESS': {
            return {
                ...model,
                successMessage: null
            };
        }

        // ===== Défaut =====
        default:
            console.warn('Message non géré:', msg.type);
            return model;
    }
};

/**
 * Recalcule toutes les stats de présence (fonction pure)
 * @param {Object} model - État
 * @returns {Object} État avec stats recalculées
 */
const recalculatePresence = (model) => {
    const todayEntries = model.entries.filter(e => e.date === model.selectedDate);

    const presenceTime = calculatePresenceTime(todayEntries);
    const presencePercentage = getCompletionPercentage(presenceTime);
    const remainingTime = getRemainingTime(presenceTime);
    const dayStatus = getDayStatus(todayEntries);
    const enabledButtons = getEnabledButtons(todayEntries);
    const breaksDuration = calculateBreaksDuration(todayEntries);

    return {
        ...model,
        presenceTime,
        presencePercentage,
        remainingTime,
        dayStatus,
        enabledButtons,
        breaksDuration
    };
};
