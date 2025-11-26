'use strict';

import { h } from '../core/vdom.js';

/**
 * Composants UI réutilisables (fonctions pures)
 * Toutes les fonctions retournent des VNodes
 */

/**
 * Crée un bouton
 * @param {Object} props - Propriétés du bouton
 * @param {string} text - Texte du bouton
 * @returns {VNode}
 */
export const button = (props, text) =>
    h('button', {
        class: `btn ${props.class || ''}`,
        ...props
    }, text);

/**
 * Crée un bouton primaire
 * @param {Object} props - Propriétés
 * @param {string} text - Texte
 * @returns {VNode}
 */
export const primaryButton = (props, text) =>
    button({ ...props, class: `${props.class || ''} btn--primary` }, text);

/**
 * Crée un bouton de danger
 * @param {Object} props - Propriétés
 * @param {string} text - Texte
 * @returns {VNode}
 */
export const dangerButton = (props, text) =>
    button({ ...props, class: `${props.class || ''} btn--danger` }, text);

/**
 * Crée un bouton secondaire
 * @param {Object} props - Propriétés
 * @param {string} text - Texte
 * @returns {VNode}
 */
export const secondaryButton = (props, text) =>
    button({ ...props, class: `${props.class || ''} btn--secondary` }, text);

/**
 * Crée un message d'erreur
 * @param {string} message - Message d'erreur
 * @param {Function} onClose - Callback pour fermer
 * @returns {VNode}
 */
export const errorMessage = (message, onClose) =>
    h('div', { class: 'toast toast--error toast--visible' }, [
        h('span', {}, message),
        h('button', {
            class: 'toast__close',
            onClick: onClose
        }, '×')
    ]);

/**
 * Crée un message de succès
 * @param {string} message - Message de succès
 * @param {Function} onClose - Callback pour fermer
 * @returns {VNode}
 */
export const successMessage = (message, onClose) =>
    h('div', { class: 'toast toast--success toast--visible' }, [
        h('span', {}, message),
        h('button', {
            class: 'toast__close',
            onClick: onClose
        }, '×')
    ]);

/**
 * Crée un spinner de chargement
 * @returns {VNode}
 */
export const spinner = () =>
    h('div', { class: 'spinner' }, [
        h('div', { class: 'spinner__circle' })
    ]);

/**
 * Crée une carte (card)
 * @param {Object} props - Propriétés
 * @param {Array|VNode} children - Contenu
 * @returns {VNode}
 */
export const card = (props, children) =>
    h('div', { class: `card ${props.class || ''}` }, children);

/**
 * Crée un header de carte
 * @param {string} title - Titre
 * @returns {VNode}
 */
export const cardHeader = (title) =>
    h('div', { class: 'card__header' }, [
        h('h2', { class: 'card__title' }, title)
    ]);

/**
 * Crée le body d'une carte
 * @param {Array|VNode} children - Contenu
 * @returns {VNode}
 */
export const cardBody = (children) =>
    h('div', { class: 'card__body' }, children);

/**
 * Crée une liste
 * @param {Object} props - Propriétés
 * @param {Array} items - Items de la liste
 * @param {Function} renderItem - Fonction de rendu pour chaque item
 * @returns {VNode}
 */
export const list = (props, items, renderItem) =>
    h('ul', { class: `list ${props.class || ''}` },
        items.length === 0
            ? [h('li', { class: 'list__empty' }, props.emptyMessage || 'Aucun élément')]
            : items.map(renderItem)
    );

/**
 * Crée un item de liste
 * @param {Object} props - Propriétés
 * @param {Array|VNode} children - Contenu
 * @returns {VNode}
 */
export const listItem = (props, children) =>
    h('li', { class: `list__item ${props.class || ''}` }, children);

/**
 * Crée un input de texte
 * @param {Object} props - Propriétés
 * @returns {VNode}
 */
export const textInput = (props) =>
    h('input', {
        type: 'text',
        class: `input ${props.class || ''}`,
        ...props
    });

/**
 * Crée un label
 * @param {string} text - Texte du label
 * @param {Object} props - Propriétés
 * @returns {VNode}
 */
export const label = (text, props = {}) =>
    h('label', { class: `label ${props.class || ''}`, ...props }, text);

/**
 * Crée un groupe de formulaire (label + input)
 * @param {string} labelText - Texte du label
 * @param {VNode} input - Input
 * @returns {VNode}
 */
export const formGroup = (labelText, input) =>
    h('div', { class: 'form-group' }, [
        label(labelText),
        input
    ]);

/**
 * Crée une barre de progression
 * @param {number} percentage - Pourcentage (0-100)
 * @param {Object} props - Propriétés additionnelles
 * @returns {VNode}
 */
export const progressBar = (percentage, props = {}) =>
    h('div', { class: `progress-bar ${props.class || ''}` }, [
        h('div', {
            class: 'progress-bar__fill',
            style: { width: `${Math.min(100, Math.max(0, percentage))}%` }
        })
    ]);

/**
 * Crée un badge
 * @param {string} text - Texte du badge
 * @param {string} type - Type (primary, success, danger, warning)
 * @returns {VNode}
 */
export const badge = (text, type = 'primary') =>
    h('span', { class: `badge badge--${type}` }, text);

/**
 * Crée une icône (emoji pour le moment)
 * @param {string} icon - Emoji ou caractère
 * @param {Object} props - Propriétés
 * @returns {VNode}
 */
export const icon = (icon, props = {}) =>
    h('span', { class: `icon ${props.class || ''}`, ...props }, icon);

/**
 * Crée un conteneur flex
 * @param {Object} props - Propriétés
 * @param {Array|VNode} children - Contenu
 * @returns {VNode}
 */
export const flexContainer = (props, children) =>
    h('div', { class: `flex ${props.class || ''}`, ...props }, children);

/**
 * Crée un modal/popover
 * @param {boolean} isOpen - Ouvert ou fermé
 * @param {string} title - Titre
 * @param {Array|VNode} children - Contenu
 * @param {Function} onClose - Callback pour fermer
 * @returns {VNode|null}
 */
export const modal = (isOpen, title, children, onClose) => {
    if (!isOpen) return null;

    return h('div', { class: 'popover-overlay', onClick: onClose }, [
        h('div', {
            class: 'popover',
            onClick: (e) => e.stopPropagation()
        }, [
            h('div', { class: 'popover__header' }, [
                h('h3', { class: 'popover__title' }, title),
                h('button', {
                    class: 'popover__close',
                    type: 'button',
                    onClick: onClose
                }, '×')
            ]),
            h('div', { class: 'popover__body' }, children)
        ])
    ]);
};

/**
 * Crée un tableau
 * @param {Array<string>} headers - En-têtes du tableau
 * @param {Array<Array>} rows - Lignes du tableau
 * @param {Object} props - Propriétés
 * @returns {VNode}
 */
export const table = (headers, rows, props = {}) =>
    h('table', { class: `table ${props.class || ''}` }, [
        h('thead', {}, [
            h('tr', {},
                headers.map(header => h('th', {}, header))
            )
        ]),
        h('tbody', {},
            rows.length === 0
                ? [h('tr', {}, [
                    h('td', {
                        colspan: headers.length,
                        class: 'table__empty'
                    }, props.emptyMessage || 'Aucune donnée')
                ])]
                : rows.map(row =>
                    h('tr', {},
                        row.map(cell => h('td', {}, cell))
                    )
                )
        )
    ]);

/**
 * Crée un séparateur
 * @returns {VNode}
 */
export const divider = () =>
    h('hr', { class: 'divider' });

/**
 * Crée un conteneur d'espacement
 * @param {string} size - Taille (small, medium, large)
 * @returns {VNode}
 */
export const spacer = (size = 'medium') =>
    h('div', { class: `spacer spacer--${size}` });
