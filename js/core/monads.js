'use strict';

/**
 * Monades pour la programmation fonctionnelle
 * Implémentation vanilla JavaScript
 */

/**
 * Monade Maybe - Gestion des valeurs nullables
 * Encapsule une valeur qui peut être null/undefined
 */
export class Maybe {
    constructor(value) {
        this._value = value;
    }

    /**
     * Crée un Maybe avec une valeur
     * @param {*} value - Valeur à encapsuler
     * @returns {Maybe}
     */
    static of(value) {
        return new Maybe(value);
    }

    /**
     * Crée un Maybe vide (Nothing)
     * @returns {Maybe}
     */
    static nothing() {
        return new Maybe(null);
    }

    /**
     * Crée un Maybe à partir d'une valeur nullable
     * @param {*} value - Valeur nullable
     * @returns {Maybe}
     */
    static fromNullable(value) {
        return value == null ? Maybe.nothing() : Maybe.of(value);
    }

    /**
     * Vérifie si c'est Nothing
     * @returns {boolean}
     */
    isNothing() {
        return this._value === null || this._value === undefined;
    }

    /**
     * Vérifie si c'est Just (a une valeur)
     * @returns {boolean}
     */
    isJust() {
        return !this.isNothing();
    }

    /**
     * Map - Applique une fonction à la valeur si elle existe
     * @param {Function} fn - Fonction de transformation
     * @returns {Maybe}
     */
    map(fn) {
        return this.isNothing() ? this : Maybe.of(fn(this._value));
    }

    /**
     * FlatMap (aussi appelé chain ou bind)
     * @param {Function} fn - Fonction qui retourne un Maybe
     * @returns {Maybe}
     */
    flatMap(fn) {
        return this.isNothing() ? this : fn(this._value);
    }

    /**
     * Alias pour flatMap
     */
    chain(fn) {
        return this.flatMap(fn);
    }

    /**
     * Applique une fonction si c'est Just, une autre si c'est Nothing
     * @param {Function} nothingFn - Fonction à appliquer si Nothing
     * @param {Function} justFn - Fonction à appliquer si Just
     * @returns {*}
     */
    fold(nothingFn, justFn) {
        return this.isNothing() ? nothingFn() : justFn(this._value);
    }

    /**
     * Retourne la valeur ou une valeur par défaut
     * @param {*} defaultValue - Valeur par défaut
     * @returns {*}
     */
    getOrElse(defaultValue) {
        return this.isNothing() ? defaultValue : this._value;
    }

    /**
     * Filter - Retourne Nothing si le prédicat échoue
     * @param {Function} predicate - Fonction de test
     * @returns {Maybe}
     */
    filter(predicate) {
        if (this.isNothing()) return this;
        return predicate(this._value) ? this : Maybe.nothing();
    }

    /**
     * ToString pour debugging
     */
    toString() {
        return this.isNothing() ? 'Maybe.Nothing' : `Maybe.Just(${this._value})`;
    }
}

/**
 * Monade Either - Gestion des erreurs fonctionnelle
 * Encapsule soit une erreur (Left) soit une valeur (Right)
 */
export class Either {
    constructor(value, isLeft = false) {
        this._value = value;
        this._isLeft = isLeft;
    }

    /**
     * Crée un Either.Left (erreur)
     * @param {*} error - Erreur
     * @returns {Either}
     */
    static left(error) {
        return new Either(error, true);
    }

    /**
     * Crée un Either.Right (succès)
     * @param {*} value - Valeur
     * @returns {Either}
     */
    static right(value) {
        return new Either(value, false);
    }

    /**
     * Alias pour Either.right
     */
    static of(value) {
        return Either.right(value);
    }

    /**
     * Crée un Either à partir d'une fonction qui peut lancer une erreur
     * @param {Function} fn - Fonction à exécuter
     * @returns {Either}
     */
    static tryCatch(fn) {
        try {
            return Either.right(fn());
        } catch (error) {
            return Either.left(error);
        }
    }

    /**
     * Vérifie si c'est un Left (erreur)
     * @returns {boolean}
     */
    isLeft() {
        return this._isLeft;
    }

    /**
     * Vérifie si c'est un Right (succès)
     * @returns {boolean}
     */
    isRight() {
        return !this._isLeft;
    }

    /**
     * Map - Applique une fonction si c'est Right
     * @param {Function} fn - Fonction de transformation
     * @returns {Either}
     */
    map(fn) {
        return this.isLeft() ? this : Either.right(fn(this._value));
    }

    /**
     * MapLeft - Applique une fonction si c'est Left
     * @param {Function} fn - Fonction de transformation
     * @returns {Either}
     */
    mapLeft(fn) {
        return this.isLeft() ? Either.left(fn(this._value)) : this;
    }

    /**
     * FlatMap - Chain pour Either
     * @param {Function} fn - Fonction qui retourne un Either
     * @returns {Either}
     */
    flatMap(fn) {
        return this.isLeft() ? this : fn(this._value);
    }

    /**
     * Alias pour flatMap
     */
    chain(fn) {
        return this.flatMap(fn);
    }

    /**
     * Fold - Applique une fonction selon Left ou Right
     * @param {Function} leftFn - Fonction pour Left
     * @param {Function} rightFn - Fonction pour Right
     * @returns {*}
     */
    fold(leftFn, rightFn) {
        return this.isLeft() ? leftFn(this._value) : rightFn(this._value);
    }

    /**
     * GetOrElse - Retourne la valeur ou une valeur par défaut
     * @param {*} defaultValue - Valeur par défaut
     * @returns {*}
     */
    getOrElse(defaultValue) {
        return this.isLeft() ? defaultValue : this._value;
    }

    /**
     * OrElse - Retourne cet Either ou un autre si Left
     * @param {Either} other - Either alternatif
     * @returns {Either}
     */
    orElse(other) {
        return this.isLeft() ? other : this;
    }

    /**
     * ToString pour debugging
     */
    toString() {
        return this.isLeft()
            ? `Either.Left(${this._value})`
            : `Either.Right(${this._value})`;
    }
}

/**
 * Monade IO - Gestion des effets de bord
 * Encapsule une opération impure et retarde son exécution
 */
export class IO {
    constructor(unsafePerformIO) {
        if (typeof unsafePerformIO !== 'function') {
            throw new Error('IO requires a function');
        }
        this._unsafePerformIO = unsafePerformIO;
    }

    /**
     * Crée un IO avec une valeur pure
     * @param {*} value - Valeur
     * @returns {IO}
     */
    static of(value) {
        return new IO(() => value);
    }

    /**
     * Crée un IO à partir d'une fonction
     * @param {Function} fn - Fonction impure
     * @returns {IO}
     */
    static from(fn) {
        return new IO(fn);
    }

    /**
     * Map - Transforme le résultat de l'IO
     * @param {Function} fn - Fonction de transformation
     * @returns {IO}
     */
    map(fn) {
        return new IO(() => fn(this._unsafePerformIO()));
    }

    /**
     * FlatMap - Chain pour IO
     * @param {Function} fn - Fonction qui retourne un IO
     * @returns {IO}
     */
    flatMap(fn) {
        return new IO(() => fn(this._unsafePerformIO())._unsafePerformIO());
    }

    /**
     * Alias pour flatMap
     */
    chain(fn) {
        return this.flatMap(fn);
    }

    /**
     * EXÉCUTION de l'effet de bord (impure!)
     * C'est la seule méthode impure - à appeler à la fin
     * @returns {*} Résultat de l'opération
     */
    unsafePerformIO() {
        return this._unsafePerformIO();
    }

    /**
     * Alias pour unsafePerformIO
     */
    run() {
        return this.unsafePerformIO();
    }

    /**
     * ToString pour debugging
     */
    toString() {
        return 'IO(?)';
    }
}

/**
 * Monade State - Threading d'état immutable
 * Permet de passer un état à travers une séquence d'opérations
 */
export class State {
    constructor(runState) {
        if (typeof runState !== 'function') {
            throw new Error('State requires a function');
        }
        this._runState = runState;
    }

    /**
     * Crée un State avec une valeur
     * @param {*} value - Valeur
     * @returns {State}
     */
    static of(value) {
        return new State(state => [value, state]);
    }

    /**
     * Récupère l'état actuel
     * @returns {State}
     */
    static get() {
        return new State(state => [state, state]);
    }

    /**
     * Remplace l'état
     * @param {*} newState - Nouvel état
     * @returns {State}
     */
    static put(newState) {
        return new State(() => [undefined, newState]);
    }

    /**
     * Modifie l'état avec une fonction
     * @param {Function} fn - Fonction de modification
     * @returns {State}
     */
    static modify(fn) {
        return new State(state => [undefined, fn(state)]);
    }

    /**
     * Map - Transforme la valeur sans toucher l'état
     * @param {Function} fn - Fonction de transformation
     * @returns {State}
     */
    map(fn) {
        return new State(state => {
            const [value, newState] = this._runState(state);
            return [fn(value), newState];
        });
    }

    /**
     * FlatMap - Chain pour State
     * @param {Function} fn - Fonction qui retourne un State
     * @returns {State}
     */
    flatMap(fn) {
        return new State(state => {
            const [value, newState] = this._runState(state);
            return fn(value)._runState(newState);
        });
    }

    /**
     * Alias pour flatMap
     */
    chain(fn) {
        return this.flatMap(fn);
    }

    /**
     * Exécute et retourne seulement la valeur
     * @param {*} initialState - État initial
     * @returns {*} Valeur finale
     */
    eval(initialState) {
        return this._runState(initialState)[0];
    }

    /**
     * Exécute et retourne seulement l'état
     * @param {*} initialState - État initial
     * @returns {*} État final
     */
    exec(initialState) {
        return this._runState(initialState)[1];
    }

    /**
     * Exécute et retourne [valeur, état]
     * @param {*} initialState - État initial
     * @returns {Array} [valeur, état]
     */
    run(initialState) {
        return this._runState(initialState);
    }

    /**
     * ToString pour debugging
     */
    toString() {
        return 'State(?)';
    }
}

/**
 * Utilitaires pour combiner des monades
 */

/**
 * Sequence - Transforme un tableau de Maybe en Maybe de tableau
 * @param {Array<Maybe>} maybes - Tableau de Maybe
 * @returns {Maybe<Array>} Maybe contenant un tableau
 */
export const sequenceMaybe = (maybes) => {
    return maybes.reduce(
        (acc, maybe) => acc.flatMap(arr =>
            maybe.map(val => [...arr, val])
        ),
        Maybe.of([])
    );
};

/**
 * Sequence pour Either
 * @param {Array<Either>} eithers - Tableau d'Either
 * @returns {Either<Array>} Either contenant un tableau
 */
export const sequenceEither = (eithers) => {
    return eithers.reduce(
        (acc, either) => acc.flatMap(arr =>
            either.map(val => [...arr, val])
        ),
        Either.of([])
    );
};

/**
 * Traverse - Map puis sequence
 * @param {Function} fn - Fonction qui retourne un Maybe
 * @param {Array} array - Tableau de valeurs
 * @returns {Maybe<Array>}
 */
export const traverseMaybe = (fn, array) => {
    return sequenceMaybe(array.map(fn));
};

/**
 * Traverse pour Either
 * @param {Function} fn - Fonction qui retourne un Either
 * @param {Array} array - Tableau de valeurs
 * @returns {Either<Array>}
 */
export const traverseEither = (fn, array) => {
    return sequenceEither(array.map(fn));
};
