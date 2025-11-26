'use strict';

/**
 * Observable - Pattern réactif pour gérer les flux de données asynchrones
 * Implémentation inspirée de RxJS mais simplifiée
 */

/**
 * Classe Observable
 */
export class Observable {
    /**
     * @param {Function} subscribe - Fonction de souscription
     */
    constructor(subscribe) {
        if (typeof subscribe !== 'function') {
            throw new Error('Observable requires a subscribe function');
        }
        this._subscribe = subscribe;
    }

    /**
     * Crée un Observable à partir d'une fonction producteur
     * @param {Function} producer - Fonction qui produit des valeurs
     * @returns {Observable}
     * @example
     * const obs$ = Observable.create(observer => {
     *   observer.next(1);
     *   observer.next(2);
     *   observer.complete();
     *   return () => console.log('cleanup');
     * });
     */
    static create(producer) {
        return new Observable(observer => {
            return producer(observer) || (() => {});
        });
    }

    /**
     * Crée un Observable qui émet une seule valeur puis complete
     * @param {*} value - Valeur à émettre
     * @returns {Observable}
     */
    static of(...values) {
        return new Observable(observer => {
            values.forEach(value => observer.next(value));
            observer.complete();
            return () => {};
        });
    }

    /**
     * Crée un Observable à partir d'un tableau
     * @param {Array} array - Tableau de valeurs
     * @returns {Observable}
     */
    static from(array) {
        if (!Array.isArray(array)) {
            throw new Error('Observable.from requires an array');
        }
        return Observable.of(...array);
    }

    /**
     * Crée un Observable qui émet des valeurs à intervalle régulier
     * @param {number} intervalMs - Intervalle en millisecondes
     * @returns {Observable}
     */
    static interval(intervalMs) {
        return new Observable(observer => {
            let count = 0;
            const id = setInterval(() => {
                observer.next(count++);
            }, intervalMs);

            return () => clearInterval(id);
        });
    }

    /**
     * Crée un Observable timer
     * @param {number} delayMs - Délai en millisecondes
     * @returns {Observable}
     */
    static timer(delayMs) {
        return new Observable(observer => {
            const id = setTimeout(() => {
                observer.next(0);
                observer.complete();
            }, delayMs);

            return () => clearTimeout(id);
        });
    }

    /**
     * Souscrit à l'Observable
     * @param {Object|Function} observerOrNext - Observer ou fonction next
     * @returns {Object} Subscription avec méthode unsubscribe
     */
    subscribe(observerOrNext) {
        const observer = typeof observerOrNext === 'function'
            ? { next: observerOrNext, error: () => {}, complete: () => {} }
            : {
                next: observerOrNext.next || (() => {}),
                error: observerOrNext.error || (() => {}),
                complete: observerOrNext.complete || (() => {})
            };

        const cleanup = this._subscribe(observer);

        return {
            unsubscribe: () => {
                if (cleanup) cleanup();
            }
        };
    }

    /**
     * Map - Transforme chaque valeur émise
     * @param {Function} fn - Fonction de transformation
     * @returns {Observable}
     */
    map(fn) {
        return new Observable(observer => {
            return this._subscribe({
                next: value => observer.next(fn(value)),
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * Filter - Filtre les valeurs selon un prédicat
     * @param {Function} predicate - Fonction de test
     * @returns {Observable}
     */
    filter(predicate) {
        return new Observable(observer => {
            return this._subscribe({
                next: value => {
                    if (predicate(value)) {
                        observer.next(value);
                    }
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * Scan - Accumule les valeurs (comme reduce mais émet à chaque étape)
     * @param {Function} reducer - Fonction de réduction
     * @param {*} seed - Valeur initiale
     * @returns {Observable}
     */
    scan(reducer, seed) {
        return new Observable(observer => {
            let accumulated = seed;
            let isFirst = true;

            return this._subscribe({
                next: value => {
                    accumulated = isFirst && seed === undefined
                        ? value
                        : reducer(accumulated, value);
                    isFirst = false;
                    observer.next(accumulated);
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * Reduce - Accumule toutes les valeurs et émet le résultat final
     * @param {Function} reducer - Fonction de réduction
     * @param {*} seed - Valeur initiale
     * @returns {Observable}
     */
    reduce(reducer, seed) {
        return new Observable(observer => {
            let accumulated = seed;
            let isFirst = true;

            return this._subscribe({
                next: value => {
                    accumulated = isFirst && seed === undefined
                        ? value
                        : reducer(accumulated, value);
                    isFirst = false;
                },
                error: err => observer.error(err),
                complete: () => {
                    observer.next(accumulated);
                    observer.complete();
                }
            });
        });
    }

    /**
     * Take - Prend seulement les N premières valeurs
     * @param {number} count - Nombre de valeurs
     * @returns {Observable}
     */
    take(count) {
        return new Observable(observer => {
            let taken = 0;
            const subscription = this._subscribe({
                next: value => {
                    if (taken < count) {
                        observer.next(value);
                        taken++;
                        if (taken === count) {
                            observer.complete();
                            subscription();
                        }
                    }
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });

            return subscription;
        });
    }

    /**
     * Skip - Ignore les N premières valeurs
     * @param {number} count - Nombre de valeurs à ignorer
     * @returns {Observable}
     */
    skip(count) {
        return new Observable(observer => {
            let skipped = 0;

            return this._subscribe({
                next: value => {
                    if (skipped >= count) {
                        observer.next(value);
                    } else {
                        skipped++;
                    }
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * DebounceTime - Émet seulement si pas de nouvelle valeur pendant X ms
     * @param {number} ms - Délai en millisecondes
     * @returns {Observable}
     */
    debounceTime(ms) {
        return new Observable(observer => {
            let timeoutId = null;

            const subscription = this._subscribe({
                next: value => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        observer.next(value);
                    }, ms);
                },
                error: err => observer.error(err),
                complete: () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    observer.complete();
                }
            });

            return () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                subscription();
            };
        });
    }

    /**
     * Distinct - Élimine les doublons consécutifs
     * @returns {Observable}
     */
    distinct() {
        return new Observable(observer => {
            let lastValue;
            let hasLast = false;

            return this._subscribe({
                next: value => {
                    if (!hasLast || value !== lastValue) {
                        observer.next(value);
                        lastValue = value;
                        hasLast = true;
                    }
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * FlatMap - Map puis flatten
     * @param {Function} fn - Fonction qui retourne un Observable
     * @returns {Observable}
     */
    flatMap(fn) {
        return new Observable(observer => {
            const subscriptions = [];

            const mainSubscription = this._subscribe({
                next: value => {
                    const innerObs = fn(value);
                    const innerSub = innerObs._subscribe({
                        next: innerValue => observer.next(innerValue),
                        error: err => observer.error(err),
                        complete: () => {}
                    });
                    subscriptions.push(innerSub);
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });

            return () => {
                mainSubscription();
                subscriptions.forEach(sub => sub());
            };
        });
    }

    /**
     * Alias pour flatMap
     */
    chain(fn) {
        return this.flatMap(fn);
    }

    /**
     * StartWith - Commence avec une valeur initiale
     * @param {*} value - Valeur initiale
     * @returns {Observable}
     */
    startWith(value) {
        return new Observable(observer => {
            observer.next(value);
            return this._subscribe(observer);
        });
    }

    /**
     * Tap - Effectue un effet de bord sans modifier le flux
     * @param {Function} fn - Fonction d'effet de bord
     * @returns {Observable}
     */
    tap(fn) {
        return new Observable(observer => {
            return this._subscribe({
                next: value => {
                    fn(value);
                    observer.next(value);
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    }

    /**
     * CatchError - Gestion d'erreur
     * @param {Function} fn - Fonction qui retourne un Observable de secours
     * @returns {Observable}
     */
    catchError(fn) {
        return new Observable(observer => {
            return this._subscribe({
                next: value => observer.next(value),
                error: err => {
                    try {
                        const recoveryObs = fn(err);
                        recoveryObs._subscribe(observer);
                    } catch (e) {
                        observer.error(e);
                    }
                },
                complete: () => observer.complete()
            });
        });
    }
}

/**
 * Utilitaires pour combiner des Observables
 */

/**
 * Merge - Fusionne plusieurs Observables
 * @param {...Observable} observables - Observables à fusionner
 * @returns {Observable}
 */
export const merge = (...observables) => {
    return new Observable(observer => {
        const subscriptions = observables.map(obs =>
            obs.subscribe({
                next: value => observer.next(value),
                error: err => observer.error(err),
                complete: () => {}
            })
        );

        return () => subscriptions.forEach(sub => sub.unsubscribe());
    });
};

/**
 * CombineLatest - Combine les dernières valeurs de plusieurs Observables
 * @param {...Observable} observables - Observables à combiner
 * @returns {Observable}
 */
export const combineLatest = (...observables) => {
    return new Observable(observer => {
        const values = new Array(observables.length);
        const hasValue = new Array(observables.length).fill(false);
        let completed = 0;

        const subscriptions = observables.map((obs, index) =>
            obs.subscribe({
                next: value => {
                    values[index] = value;
                    hasValue[index] = true;

                    if (hasValue.every(Boolean)) {
                        observer.next([...values]);
                    }
                },
                error: err => observer.error(err),
                complete: () => {
                    completed++;
                    if (completed === observables.length) {
                        observer.complete();
                    }
                }
            })
        );

        return () => subscriptions.forEach(sub => sub.unsubscribe());
    });
};

/**
 * FromEvent - Crée un Observable à partir d'événements DOM
 * @param {Element} element - Élément DOM
 * @param {string} eventName - Nom de l'événement
 * @returns {Observable}
 */
export const fromEvent = (element, eventName) => {
    return new Observable(observer => {
        const handler = event => observer.next(event);
        element.addEventListener(eventName, handler);

        return () => element.removeEventListener(eventName, handler);
    });
};
