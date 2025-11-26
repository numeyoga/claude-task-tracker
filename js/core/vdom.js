'use strict';

/**
 * Virtual DOM - Implémentation minimaliste
 * Permet de créer des interfaces utilisateur déclaratives avec des fonctions pures
 */

/**
 * Crée un nœud virtuel (VNode)
 * @param {string} tag - Nom de la balise HTML
 * @param {Object} props - Propriétés et attributs
 * @param {Array|string|VNode} children - Enfants du nœud
 * @returns {VNode} Nœud virtuel
 * @example
 * h('div', { class: 'container', id: 'main' }, [
 *   h('h1', {}, 'Titre'),
 *   h('p', {}, 'Paragraphe')
 * ])
 */
export const h = (tag, props = {}, children = []) => {
    // Normaliser les enfants
    const normalizedChildren = Array.isArray(children)
        ? children
        : [children];

    // Filtrer les valeurs null/undefined/false
    const filteredChildren = normalizedChildren
        .filter(child => child !== null && child !== undefined && child !== false)
        .map(child => {
            // Convertir les primitives en VNode texte
            if (typeof child === 'string' || typeof child === 'number') {
                return createTextVNode(String(child));
            }
            return child;
        });

    return {
        type: 'element',
        tag,
        props: props || {},
        children: filteredChildren,
        key: props && props.key
    };
};

/**
 * Crée un nœud texte virtuel
 * @param {string} text - Texte
 * @returns {VNode}
 */
const createTextVNode = (text) => ({
    type: 'text',
    text
});

/**
 * Convertit un VNode en élément DOM réel
 * @param {VNode} vnode - Nœud virtuel
 * @returns {Element|Text} Élément DOM
 */
export const createElement = (vnode) => {
    if (vnode.type === 'text') {
        return document.createTextNode(vnode.text);
    }

    const element = document.createElement(vnode.tag);

    // Appliquer les props
    updateProps(element, {}, vnode.props);

    // Créer les enfants
    vnode.children.forEach(child => {
        element.appendChild(createElement(child));
    });

    return element;
};

/**
 * Met à jour les propriétés d'un élément DOM
 * @param {Element} element - Élément DOM
 * @param {Object} oldProps - Anciennes propriétés
 * @param {Object} newProps - Nouvelles propriétés
 */
const updateProps = (element, oldProps, newProps) => {
    // Supprimer les anciennes props qui n'existent plus
    Object.keys(oldProps).forEach(name => {
        if (!(name in newProps)) {
            removeProp(element, name, oldProps[name]);
        }
    });

    // Ajouter ou mettre à jour les nouvelles props
    Object.keys(newProps).forEach(name => {
        if (oldProps[name] !== newProps[name]) {
            setProp(element, name, newProps[name]);
        }
    });
};

/**
 * Définit une propriété sur un élément
 * @param {Element} element - Élément DOM
 * @param {string} name - Nom de la propriété
 * @param {*} value - Valeur
 */
const setProp = (element, name, value) => {
    // Gestion spéciale pour certaines props
    if (name === 'className' || name === 'class') {
        element.className = value;
    } else if (name === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
    } else if (name.startsWith('on') && typeof value === 'function') {
        // Event listeners
        const eventName = name.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
    } else if (name === 'key') {
        // 'key' est utilisé pour le diff, pas un attribut réel
        return;
    } else if (name in element) {
        // Propriété DOM
        element[name] = value;
    } else {
        // Attribut HTML
        element.setAttribute(name, value);
    }
};

/**
 * Supprime une propriété d'un élément
 * @param {Element} element - Élément DOM
 * @param {string} name - Nom de la propriété
 * @param {*} value - Valeur (pour les event listeners)
 */
const removeProp = (element, name, value) => {
    if (name === 'className' || name === 'class') {
        element.className = '';
    } else if (name === 'style') {
        element.removeAttribute('style');
    } else if (name.startsWith('on') && typeof value === 'function') {
        const eventName = name.substring(2).toLowerCase();
        element.removeEventListener(eventName, value);
    } else if (name === 'key') {
        return;
    } else if (name in element) {
        element[name] = '';
    } else {
        element.removeAttribute(name);
    }
};

/**
 * Compare deux VNodes et retourne les différences
 * @param {VNode} oldVNode - Ancien nœud virtuel
 * @param {VNode} newVNode - Nouveau nœud virtuel
 * @returns {Patch} Patch à appliquer
 */
export const diff = (oldVNode, newVNode) => {
    // Cas 1: newVNode est null/undefined -> REMOVE
    if (newVNode === null || newVNode === undefined) {
        return { type: 'REMOVE' };
    }

    // Cas 2: oldVNode est null/undefined -> CREATE
    if (oldVNode === null || oldVNode === undefined) {
        return { type: 'CREATE', vnode: newVNode };
    }

    // Cas 3: Types différents -> REPLACE
    if (oldVNode.type !== newVNode.type || oldVNode.tag !== newVNode.tag) {
        return { type: 'REPLACE', vnode: newVNode };
    }

    // Cas 4: Nœud texte -> UPDATE_TEXT si différent
    if (newVNode.type === 'text') {
        if (oldVNode.text !== newVNode.text) {
            return { type: 'UPDATE_TEXT', text: newVNode.text };
        }
        return { type: 'NONE' };
    }

    // Cas 5: Élément -> Diff des props et enfants
    const propsPatch = diffProps(oldVNode.props, newVNode.props);
    const childrenPatches = diffChildren(oldVNode.children, newVNode.children);

    if (propsPatch.type !== 'NONE' || childrenPatches.some(p => p && p.type !== 'NONE')) {
        return {
            type: 'UPDATE',
            props: propsPatch,
            children: childrenPatches
        };
    }

    return { type: 'NONE' };
};

/**
 * Compare les propriétés de deux VNodes
 * @param {Object} oldProps - Anciennes props
 * @param {Object} newProps - Nouvelles props
 * @returns {Patch}
 */
const diffProps = (oldProps, newProps) => {
    const patches = {};
    let hasChanges = false;

    // Props supprimées
    Object.keys(oldProps).forEach(key => {
        if (!(key in newProps)) {
            patches[key] = null;
            hasChanges = true;
        }
    });

    // Props ajoutées ou modifiées
    Object.keys(newProps).forEach(key => {
        if (oldProps[key] !== newProps[key]) {
            patches[key] = newProps[key];
            hasChanges = true;
        }
    });

    return hasChanges ? { type: 'UPDATE_PROPS', patches } : { type: 'NONE' };
};

/**
 * Compare les enfants de deux VNodes
 * @param {Array} oldChildren - Anciens enfants
 * @param {Array} newChildren - Nouveaux enfants
 * @returns {Array<Patch>}
 */
const diffChildren = (oldChildren, newChildren) => {
    const patches = [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        patches[i] = diff(oldChildren[i], newChildren[i]);
    }

    return patches;
};

/**
 * Applique un patch à un élément DOM
 * @param {Element} parent - Élément parent
 * @param {Patch} patch - Patch à appliquer
 * @param {Element} element - Élément à patcher (optionnel)
 * @param {number} index - Index de l'enfant (optionnel)
 * @returns {Element} Élément patché
 */
export const patch = (parent, patchData, element = null, index = 0) => {
    if (!patchData || patchData.type === 'NONE') {
        return element;
    }

    switch (patchData.type) {
        case 'CREATE': {
            const newElement = createElement(patchData.vnode);
            parent.appendChild(newElement);
            return newElement;
        }

        case 'REMOVE': {
            parent.removeChild(parent.childNodes[index]);
            return null;
        }

        case 'REPLACE': {
            const newElement = createElement(patchData.vnode);
            parent.replaceChild(newElement, parent.childNodes[index]);
            return newElement;
        }

        case 'UPDATE_TEXT': {
            element.textContent = patchData.text;
            return element;
        }

        case 'UPDATE': {
            // Mettre à jour les props
            if (patchData.props && patchData.props.type === 'UPDATE_PROPS') {
                const oldProps = {};
                const newProps = patchData.props.patches;

                Object.keys(newProps).forEach(key => {
                    if (newProps[key] === null) {
                        removeProp(element, key, element[key]);
                    } else {
                        setProp(element, key, newProps[key]);
                    }
                });
            }

            // Mettre à jour les enfants
            if (patchData.children) {
                patchData.children.forEach((childPatch, i) => {
                    patch(element, childPatch, element.childNodes[i], i);
                });
            }

            return element;
        }

        default:
            return element;
    }
};

/**
 * Render - Fonction de rendu complète
 * @param {VNode} vnode - Nœud virtuel à rendre
 * @param {Element} container - Container DOM
 */
export const render = (vnode, container) => {
    // Vider le container
    container.innerHTML = '';

    // Créer et ajouter le nouvel élément
    const element = createElement(vnode);
    container.appendChild(element);
};

/**
 * Utilitaire pour créer un fragment (wrapper virtuel)
 * @param {Array} children - Enfants
 * @returns {VNode}
 */
export const fragment = (children) => {
    return h('div', { style: { display: 'contents' } }, children);
};

/**
 * Utilitaire pour créer des listes avec keys
 * @param {Array} items - Items à rendre
 * @param {Function} renderFn - Fonction de rendu pour chaque item
 * @param {Function} keyFn - Fonction pour extraire la key
 * @returns {Array<VNode>}
 */
export const list = (items, renderFn, keyFn) => {
    return items.map((item, index) => {
        const vnode = renderFn(item, index);
        if (keyFn) {
            vnode.key = keyFn(item);
        }
        return vnode;
    });
};
