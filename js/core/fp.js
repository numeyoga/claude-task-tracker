'use strict';

/**
 * Utilitaires de programmation fonctionnelle
 * Implémentation vanilla JavaScript sans dépendances
 */

/**
 * Composition de fonctions de gauche à droite
 * @param {...Function} fns - Fonctions à composer
 * @returns {Function} Fonction composée
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * const addOneThenDouble = pipe(addOne, double);
 * addOneThenDouble(3); // 8
 */
export const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

/**
 * Composition de fonctions de droite à gauche
 * @param {...Function} fns - Fonctions à composer
 * @returns {Function} Fonction composée
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * const doubleAndAddOne = compose(addOne, double);
 * doubleAndAddOne(3); // 7
 */
export const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

/**
 * Currying automatique d'une fonction
 * @param {Function} fn - Fonction à currifier
 * @returns {Function} Fonction curryfiée
 * @example
 * const add = (a, b, c) => a + b + c;
 * const curriedAdd = curry(add);
 * curriedAdd(1)(2)(3); // 6
 * curriedAdd(1, 2)(3); // 6
 * curriedAdd(1)(2, 3); // 6
 */
export const curry = (fn) => {
    const arity = fn.length;

    return function curried(...args) {
        if (args.length >= arity) {
            return fn.apply(this, args);
        }

        return function(...nextArgs) {
            return curried.apply(this, args.concat(nextArgs));
        };
    };
};

/**
 * Map générique
 * @param {Function} fn - Fonction de transformation
 * @param {Array} functor - Structure de données à transformer
 * @returns {Array} Nouvelle structure transformée
 */
export const map = curry((fn, functor) => {
    if (Array.isArray(functor)) {
        return functor.map(fn);
    }
    throw new Error('map: functor must be an Array');
});

/**
 * Filter générique
 * @param {Function} predicate - Fonction de test
 * @param {Array} filterable - Structure à filtrer
 * @returns {Array} Nouvelle structure filtrée
 */
export const filter = curry((predicate, filterable) => {
    if (Array.isArray(filterable)) {
        return filterable.filter(predicate);
    }
    throw new Error('filter: filterable must be an Array');
});

/**
 * Reduce générique
 * @param {Function} reducer - Fonction de réduction
 * @param {*} initial - Valeur initiale
 * @param {Array} reducible - Structure à réduire
 * @returns {*} Valeur réduite
 */
export const reduce = curry((reducer, initial, reducible) => {
    if (Array.isArray(reducible)) {
        return reducible.reduce(reducer, initial);
    }
    throw new Error('reduce: reducible must be an Array');
});

/**
 * Retourne le premier élément d'un tableau
 * @param {Array} array - Tableau
 * @returns {*} Premier élément ou undefined
 */
export const head = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('head: argument must be an Array');
    }
    return array[0];
};

/**
 * Retourne tous les éléments sauf le premier
 * @param {Array} array - Tableau
 * @returns {Array} Nouveau tableau sans le premier élément
 */
export const tail = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('tail: argument must be an Array');
    }
    return array.slice(1);
};

/**
 * Prend les N premiers éléments
 * @param {number} n - Nombre d'éléments
 * @param {Array} array - Tableau
 * @returns {Array} N premiers éléments
 */
export const take = curry((n, array) => {
    if (!Array.isArray(array)) {
        throw new Error('take: second argument must be an Array');
    }
    return array.slice(0, n);
});

/**
 * Supprime les N premiers éléments
 * @param {number} n - Nombre d'éléments à supprimer
 * @param {Array} array - Tableau
 * @returns {Array} Tableau sans les N premiers éléments
 */
export const drop = curry((n, array) => {
    if (!Array.isArray(array)) {
        throw new Error('drop: second argument must be an Array');
    }
    return array.slice(n);
});

/**
 * Fonction identité
 * @param {*} x - Valeur
 * @returns {*} La même valeur
 */
export const identity = (x) => x;

/**
 * Fonction constante
 * @param {*} x - Valeur
 * @returns {Function} Fonction qui retourne toujours x
 */
export const constant = (x) => () => x;

/**
 * Aplatit un tableau d'un niveau
 * @param {Array} array - Tableau de tableaux
 * @returns {Array} Tableau aplati
 */
export const flatten = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('flatten: argument must be an Array');
    }
    return array.reduce((acc, val) => acc.concat(val), []);
};

/**
 * FlatMap (map suivi de flatten)
 * @param {Function} fn - Fonction de transformation
 * @param {Array} array - Tableau
 * @returns {Array} Tableau transformé et aplati
 */
export const flatMap = curry((fn, array) => {
    if (!Array.isArray(array)) {
        throw new Error('flatMap: second argument must be an Array');
    }
    return flatten(array.map(fn));
});

/**
 * Somme d'un tableau de nombres
 * @param {Array<number>} array - Tableau de nombres
 * @returns {number} Somme
 */
export const sum = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('sum: argument must be an Array');
    }
    return array.reduce((acc, val) => acc + val, 0);
};

/**
 * Maximum d'un tableau de nombres
 * @param {Array<number>} array - Tableau de nombres
 * @returns {number} Maximum
 */
export const max = (array) => {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error('max: argument must be a non-empty Array');
    }
    return Math.max(...array);
};

/**
 * Minimum d'un tableau de nombres
 * @param {Array<number>} array - Tableau de nombres
 * @returns {number} Minimum
 */
export const min = (array) => {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error('min: argument must be a non-empty Array');
    }
    return Math.min(...array);
};

/**
 * Trouve un élément dans un tableau
 * @param {Function} predicate - Fonction de test
 * @param {Array} array - Tableau
 * @returns {*} Élément trouvé ou undefined
 */
export const find = curry((predicate, array) => {
    if (!Array.isArray(array)) {
        throw new Error('find: second argument must be an Array');
    }
    return array.find(predicate);
});

/**
 * Vérifie si un élément existe dans un tableau
 * @param {Function} predicate - Fonction de test
 * @param {Array} array - Tableau
 * @returns {boolean} true si trouvé
 */
export const some = curry((predicate, array) => {
    if (!Array.isArray(array)) {
        throw new Error('some: second argument must be an Array');
    }
    return array.some(predicate);
});

/**
 * Vérifie si tous les éléments satisfont le prédicat
 * @param {Function} predicate - Fonction de test
 * @param {Array} array - Tableau
 * @returns {boolean} true si tous satisfont
 */
export const every = curry((predicate, array) => {
    if (!Array.isArray(array)) {
        throw new Error('every: second argument must be an Array');
    }
    return array.every(predicate);
});

/**
 * Trie un tableau (pure function)
 * @param {Function} compareFn - Fonction de comparaison
 * @param {Array} array - Tableau à trier
 * @returns {Array} Nouveau tableau trié
 */
export const sort = curry((compareFn, array) => {
    if (!Array.isArray(array)) {
        throw new Error('sort: second argument must be an Array');
    }
    return [...array].sort(compareFn);
});

/**
 * Inverse un tableau (pure function)
 * @param {Array} array - Tableau à inverser
 * @returns {Array} Nouveau tableau inversé
 */
export const reverse = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('reverse: argument must be an Array');
    }
    return [...array].reverse();
};

/**
 * Groupe les éléments par clé
 * @param {Function} keyFn - Fonction qui extrait la clé
 * @param {Array} array - Tableau à grouper
 * @returns {Object} Objet avec les éléments groupés
 */
export const groupBy = curry((keyFn, array) => {
    if (!Array.isArray(array)) {
        throw new Error('groupBy: second argument must be an Array');
    }

    return array.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});
});

/**
 * Élimine les doublons d'un tableau
 * @param {Array} array - Tableau
 * @returns {Array} Tableau sans doublons
 */
export const unique = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('unique: argument must be an Array');
    }
    return [...new Set(array)];
};

/**
 * Zip deux tableaux ensemble
 * @param {Array} arr1 - Premier tableau
 * @param {Array} arr2 - Deuxième tableau
 * @returns {Array} Tableau de paires
 */
export const zip = curry((arr1, arr2) => {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        throw new Error('zip: both arguments must be Arrays');
    }

    const length = Math.min(arr1.length, arr2.length);
    const result = [];

    for (let i = 0; i < length; i++) {
        result.push([arr1[i], arr2[i]]);
    }

    return result;
});

/**
 * Applique une fonction avec des arguments inversés
 * @param {Function} fn - Fonction
 * @returns {Function} Fonction avec arguments inversés
 */
export const flip = (fn) => curry((a, b) => fn(b, a));

/**
 * Prop - Accède à une propriété d'un objet de manière sûre
 * @param {string} key - Clé de la propriété
 * @param {Object} obj - Objet
 * @returns {*} Valeur de la propriété
 */
export const prop = curry((key, obj) => {
    if (obj == null) return undefined;
    return obj[key];
});

/**
 * Props - Accède à plusieurs propriétés
 * @param {Array<string>} keys - Clés des propriétés
 * @param {Object} obj - Objet
 * @returns {Array} Valeurs des propriétés
 */
export const props = curry((keys, obj) => {
    if (obj == null) return keys.map(() => undefined);
    return keys.map(key => obj[key]);
});
