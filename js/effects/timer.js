'use strict';

import { Observable } from '../core/observable.js';
import { ProjectSession } from '../model/session.js';

/**
 * Effets de timer avec Observables
 * Gestion fonctionnelle du temps qui passe
 */

/**
 * Crée un Observable qui émet chaque seconde le temps écoulé
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<number>} Observable qui émet le temps écoulé en ms
 * @example
 * const timer$ = createTimer$(1000);
 * timer$.subscribe(elapsed => console.log(`${elapsed}ms écoulés`));
 */
export const createTimer$ = (interval = 1000) =>
    Observable.interval(interval).map((count) => (count + 1) * interval);

/**
 * Crée un Observable de timer formaté (heures, minutes, secondes)
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<Object>} Observable qui émet {hours, minutes, seconds, milliseconds}
 * @example
 * const timer$ = createFormattedTimer$(1000);
 * timer$.subscribe(time => console.log(`${time.hours}h ${time.minutes}m ${time.seconds}s`));
 */
export const createFormattedTimer$ = (interval = 1000) =>
    createTimer$(interval).map(ms => ({
        milliseconds: ms,
        hours: Math.floor(ms / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000)
    }));

/**
 * Crée un Observable de timer pour une session de projet
 * Émet la durée de la session chaque seconde
 * @param {Object} session - ProjectSession
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<number>} Observable qui émet la durée en ms
 * @example
 * const session = ProjectSession.create('project-id');
 * const timer$ = createSessionTimer$(session, 1000);
 * timer$.subscribe(duration => console.log(`Session: ${duration}ms`));
 */
export const createSessionTimer$ = (session, interval = 1000) => {
    if (!session || session.endTime !== null) {
        // Session terminée ou invalide - retourne un Observable vide
        return Observable.of(ProjectSession.getDuration(session));
    }

    // Calculer le temps déjà écoulé au démarrage du timer
    const initialDuration = ProjectSession.getDuration(session);

    return Observable.interval(interval).map((count) => {
        const additionalTime = (count + 1) * interval;
        return initialDuration + additionalTime;
    });
};

/**
 * Crée un Observable de timer formaté pour une session
 * @param {Object} session - ProjectSession
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<Object>} Observable qui émet {hours, minutes, seconds, milliseconds}
 */
export const createFormattedSessionTimer$ = (session, interval = 1000) =>
    createSessionTimer$(session, interval).map(ms => ({
        milliseconds: ms,
        hours: Math.floor(ms / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000)
    }));

/**
 * Crée un Observable de compte à rebours
 * @param {number} durationMs - Durée totale en millisecondes
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<number>} Observable qui émet le temps restant en ms
 * @example
 * const countdown$ = createCountdown$(60000, 1000); // 1 minute
 * countdown$.subscribe(remaining => console.log(`${remaining}ms restants`));
 */
export const createCountdown$ = (durationMs, interval = 1000) =>
    Observable.interval(interval)
        .map((count) => {
            const elapsed = (count + 1) * interval;
            const remaining = Math.max(0, durationMs - elapsed);
            return remaining;
        })
        .filter(remaining => remaining >= 0)
        .take(Math.ceil(durationMs / interval) + 1);

/**
 * Crée un Observable de compte à rebours formaté
 * @param {number} durationMs - Durée totale en millisecondes
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<Object>} Observable qui émet {hours, minutes, seconds, milliseconds}
 */
export const createFormattedCountdown$ = (durationMs, interval = 1000) =>
    createCountdown$(durationMs, interval).map(ms => ({
        milliseconds: ms,
        hours: Math.floor(ms / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000)
    }));

/**
 * Crée un Observable qui émet la progression d'un timer (0-100%)
 * @param {number} targetMs - Objectif en millisecondes
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<Object>} Observable qui émet {elapsed, percentage}
 * @example
 * const progress$ = createProgressTimer$(28800000, 1000); // 8h
 * progress$.subscribe(({elapsed, percentage}) =>
 *   console.log(`${percentage}% complété`)
 * );
 */
export const createProgressTimer$ = (targetMs, interval = 1000) =>
    createTimer$(interval).map(elapsed => ({
        elapsed,
        percentage: Math.min(100, Math.round((elapsed / targetMs) * 100))
    }));

/**
 * Crée un Observable qui émet quand un objectif de temps est atteint
 * @param {number} targetMs - Objectif en millisecondes
 * @param {number} interval - Intervalle de vérification en ms (défaut: 1000ms)
 * @returns {Observable<number>} Observable qui émet une fois quand l'objectif est atteint
 * @example
 * const goal$ = createGoalTimer$(28800000); // 8h
 * goal$.subscribe(elapsed => console.log('Objectif atteint!'));
 */
export const createGoalTimer$ = (targetMs, interval = 1000) =>
    createTimer$(interval)
        .filter(elapsed => elapsed >= targetMs)
        .take(1);

/**
 * Crée un Observable qui émet à des jalons spécifiques
 * @param {Array<number>} milestones - Jalons en millisecondes
 * @param {number} interval - Intervalle de vérification en ms (défaut: 1000ms)
 * @returns {Observable<Object>} Observable qui émet {milestone, elapsed}
 * @example
 * const milestones$ = createMilestoneTimer$([3600000, 7200000, 14400000]); // 1h, 2h, 4h
 * milestones$.subscribe(({milestone, elapsed}) =>
 *   console.log(`Jalon ${milestone}ms atteint!`)
 * );
 */
export const createMilestoneTimer$ = (milestones, interval = 1000) => {
    const sortedMilestones = [...milestones].sort((a, b) => a - b);
    let milestoneIndex = 0;

    return createTimer$(interval)
        .filter(elapsed => {
            if (milestoneIndex >= sortedMilestones.length) {
                return false;
            }
            return elapsed >= sortedMilestones[milestoneIndex];
        })
        .map(elapsed => {
            const milestone = sortedMilestones[milestoneIndex];
            milestoneIndex++;
            return { milestone, elapsed };
        })
        .take(sortedMilestones.length);
};

/**
 * Crée un Observable qui rafraîchit les données périodiquement
 * Utile pour mettre à jour l'UI avec les temps qui passent
 * @param {number} interval - Intervalle de rafraîchissement en ms
 * @returns {Observable<number>} Observable qui émet le timestamp actuel
 * @example
 * const refresh$ = createRefreshTimer$(5000); // Toutes les 5 secondes
 * refresh$.subscribe(timestamp => refreshUI());
 */
export const createRefreshTimer$ = (interval) =>
    Observable.interval(interval).map(() => Date.now());

/**
 * Crée un Observable pour l'horloge système (heure actuelle)
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<Date>} Observable qui émet la date actuelle
 * @example
 * const clock$ = createClockTimer$(1000);
 * clock$.subscribe(date => console.log(date.toLocaleTimeString()));
 */
export const createClockTimer$ = (interval = 1000) =>
    Observable.interval(interval).map(() => new Date());

/**
 * Crée un Observable pour l'horloge formatée
 * @param {number} interval - Intervalle en millisecondes (défaut: 1000ms)
 * @returns {Observable<Object>} Observable qui émet {hours, minutes, seconds, date}
 */
export const createFormattedClockTimer$ = (interval = 1000) =>
    createClockTimer$(interval).map(date => ({
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        date: date
    }));

/**
 * Combine plusieurs timers en un seul Observable
 * @param {...Observable} timers - Observables de timers
 * @returns {Observable<Array>} Observable qui émet un tableau des dernières valeurs
 * @example
 * const timer1$ = createTimer$(1000);
 * const timer2$ = createSessionTimer$(session, 1000);
 * const combined$ = combineTimers(timer1$, timer2$);
 * combined$.subscribe(([elapsed1, elapsed2]) => {
 *   console.log(`Timer 1: ${elapsed1}ms, Timer 2: ${elapsed2}ms`);
 * });
 */
export const combineTimers = (...timers) => {
    // Utiliser combineLatest pour combiner les timers
    return Observable.create(observer => {
        const values = new Array(timers.length);
        const hasValue = new Array(timers.length).fill(false);
        let completed = 0;

        const subscriptions = timers.map((timer, index) =>
            timer.subscribe({
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
                    if (completed === timers.length) {
                        observer.complete();
                    }
                }
            })
        );

        return () => subscriptions.forEach(sub => sub.unsubscribe());
    });
};

/**
 * Crée un timer qui se pause et reprend
 * @param {Observable<boolean>} control$ - Observable de contrôle (true = play, false = pause)
 * @param {number} interval - Intervalle en millisecondes
 * @returns {Observable<number>} Observable qui émet le temps écoulé (sans compter les pauses)
 */
export const createPausableTimer$ = (control$, interval = 1000) => {
    return Observable.create(observer => {
        let isPaused = false;
        let elapsed = 0;
        let intervalId = null;

        const controlSub = control$.subscribe({
            next: isRunning => {
                isPaused = !isRunning;

                if (isRunning && !intervalId) {
                    // Démarrer le timer
                    intervalId = setInterval(() => {
                        if (!isPaused) {
                            elapsed += interval;
                            observer.next(elapsed);
                        }
                    }, interval);
                } else if (!isRunning && intervalId) {
                    // Mettre en pause (sans arrêter l'intervalle)
                    // L'intervalle continue mais on n'incrémente pas elapsed
                }
            },
            error: err => observer.error(err),
            complete: () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                observer.complete();
            }
        });

        return () => {
            controlSub.unsubscribe();
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    });
};
