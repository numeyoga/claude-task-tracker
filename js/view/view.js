'use strict';

import { h } from '../core/vdom.js';
import { renderTracker } from './tracker.js';
import { errorMessage, successMessage } from './common.js';

/**
 * Vue principale de l'application (fonction pure)
 * Retourne un VNode représentant toute l'UI
 *
 * @param {Object} model - État global de l'application
 * @param {Function} dispatch - Fonction pour envoyer des messages
 * @returns {VNode} VNode racine de l'application
 */
export const view = (model, dispatch) => {
    return h('div', { class: 'app' }, [
        // Navigation
        renderNavigation(model, dispatch),

        // Contenu principal selon la vue active
        h('main', { class: 'app__content' }, [
            renderCurrentView(model, dispatch)
        ]),

        // Messages toast
        renderMessages(model, dispatch)
    ]);
};

/**
 * Rend la barre de navigation
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderNavigation = (model, dispatch) => {
    return h('nav', { class: 'nav' }, [
        h('div', { class: 'nav__brand' }, [
            h('h1', { class: 'nav__title' }, 'Claude Time Tracker')
        ]),
        h('div', { class: 'nav__links' }, [
            renderNavLink('Pointage', 'tracker', model.currentView, dispatch),
            renderNavLink('Projets', 'projects', model.currentView, dispatch),
            renderNavLink('Rapports', 'reports', model.currentView, dispatch),
            renderNavLink('Entrées', 'entries', model.currentView, dispatch),
            renderNavLink('Sessions', 'sessions', model.currentView, dispatch)
        ])
    ]);
};

/**
 * Rend un lien de navigation
 * @param {string} label - Libellé
 * @param {string} view - Vue cible
 * @param {string} currentView - Vue actuelle
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderNavLink = (label, view, currentView, dispatch) => {
    const isActive = currentView === view;

    return h('button', {
        class: `nav__link ${isActive ? 'nav__link--active' : ''}`,
        onClick: () => dispatch({ type: 'CHANGE_VIEW', view })
    }, label);
};

/**
 * Rend la vue actuelle
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode}
 */
const renderCurrentView = (model, dispatch) => {
    switch (model.currentView) {
        case 'tracker':
            return renderTracker(model, dispatch);

        case 'projects':
            return renderProjectsPlaceholder();

        case 'reports':
            return renderReportsPlaceholder();

        case 'entries':
            return renderEntriesPlaceholder();

        case 'sessions':
            return renderSessionsPlaceholder();

        default:
            return renderTracker(model, dispatch);
    }
};

/**
 * Rend les messages toast
 * @param {Object} model - État
 * @param {Function} dispatch - Dispatch
 * @returns {VNode|null}
 */
const renderMessages = (model, dispatch) => {
    if (model.errorMessage) {
        return errorMessage(model.errorMessage, () =>
            dispatch({ type: 'CLEAR_ERROR' })
        );
    }

    if (model.successMessage) {
        return successMessage(model.successMessage, () =>
            dispatch({ type: 'CLEAR_SUCCESS' })
        );
    }

    return null;
};

// Placeholders pour les autres vues (à implémenter dans des fichiers séparés)

const renderProjectsPlaceholder = () =>
    h('div', { class: 'placeholder' }, [
        h('h2', {}, 'Gestion des Projets'),
        h('p', {}, 'Vue à implémenter avec les composants Virtual DOM')
    ]);

const renderReportsPlaceholder = () =>
    h('div', { class: 'placeholder' }, [
        h('h2', {}, 'Rapports'),
        h('p', {}, 'Vue à implémenter avec les composants Virtual DOM')
    ]);

const renderEntriesPlaceholder = () =>
    h('div', { class: 'placeholder' }, [
        h('h2', {}, 'Gestion des Entrées'),
        h('p', {}, 'Vue à implémenter avec les composants Virtual DOM')
    ]);

const renderSessionsPlaceholder = () =>
    h('div', { class: 'placeholder' }, [
        h('h2', {}, 'Gestion des Sessions'),
        h('p', {}, 'Vue à implémenter avec les composants Virtual DOM')
    ]);
