'use strict';

import { diff, patch, createElement } from './vdom.js';

/**
 * Runtime Elm - Le moteur de l'application
 * C'est la SEULE partie impure de l'application
 *
 * Responsabilités:
 * - Gérer la boucle de mise à jour (Model -> Update -> View)
 * - Appliquer le Virtual DOM au DOM réel (diff & patch)
 * - Gérer les effets de bord
 * - Maintenir l'historique (pour time-travel debugging)
 */

/**
 * Crée le runtime de l'application
 * @param {Object} initialModel - État initial
 * @param {Function} update - Fonction update pure
 * @param {Function} view - Fonction view pure
 * @param {Object} effects - Objet contenant les effets (storage, etc.)
 * @returns {Object} Runtime avec méthodes init, dispatch, getModel
 */
export const createRuntime = (initialModel, update, view, effects = {}) => {
    // État du runtime
    let currentModel = initialModel;
    let currentVdom = null;
    let rootElement = null;

    // Historique pour time-travel debugging
    const history = [];
    const maxHistorySize = 100;

    // Gestionnaires d'effets
    const effectHandlers = {
        storage: effects.storage || null,
        subscriptions: []
    };

    /**
     * Fonction dispatch - Envoie un message et déclenche la mise à jour
     * C'est le point d'entrée pour toutes les actions
     * @param {Object} msg - Message/Action
     */
    const dispatch = (msg) => {
        console.log('📨 Message:', msg);

        // 1. Sauvegarder l'état actuel dans l'historique
        if (history.length >= maxHistorySize) {
            history.shift(); // Limiter la taille de l'historique
        }
        history.push({
            msg,
            model: currentModel,
            timestamp: Date.now()
        });

        // 2. Update (pure function)
        const newModel = update(msg, currentModel);

        // 3. Vérifier si le modèle a changé
        if (newModel === currentModel) {
            console.log('⏭️  Pas de changement');
            return;
        }

        console.log('📝 Nouveau modèle');
        currentModel = newModel;

        // 4. Re-render (pure function)
        render();

        // 5. Gérer les effets de bord
        handleEffects(msg, currentModel, dispatch);
    };

    /**
     * Fonction render - Met à jour le DOM via Virtual DOM
     * IMPURE: Modifie le DOM réel
     */
    const render = () => {
        if (!rootElement) {
            console.error('❌ Root element pas initialisé');
            return;
        }

        // Générer le nouveau Virtual DOM (pure)
        const newVdom = view(currentModel, dispatch);

        if (currentVdom === null) {
            // Premier render
            console.log('🎨 Premier rendu');
            rootElement.innerHTML = '';
            const element = createElement(newVdom);
            rootElement.appendChild(element);
        } else {
            // Diff & patch
            console.log('🔄 Diff & patch');
            const patches = diff(currentVdom, newVdom);

            if (patches.type !== 'NONE') {
                patch(rootElement, patches, rootElement.firstChild, 0);
            }
        }

        currentVdom = newVdom;
    };

    /**
     * Gère les effets de bord en fonction du message
     * IMPURE: Exécute des effets de bord
     * @param {Object} msg - Message
     * @param {Object} model - Modèle actuel
     * @param {Function} dispatch - Fonction dispatch
     */
    const handleEffects = (msg, model, dispatch) => {
        if (!effectHandlers.storage) return;

        const storage = effectHandlers.storage;

        switch (msg.type) {
            case 'CLOCK_IN':
            case 'CLOCK_OUT':
            case 'BREAK_START':
            case 'BREAK_END': {
                // Sauvegarder la nouvelle entrée
                const newEntry = model.entries[model.entries.length - 1];
                storage.saveEntry(newEntry)
                    .unsafePerformIO()
                    .then(() => {
                        console.log('✅ Entrée sauvegardée');
                        dispatch({ type: 'SUCCESS', message: 'Pointage enregistré' });
                    })
                    .catch(error => {
                        console.error('❌ Erreur sauvegarde:', error);
                        dispatch({ type: 'ERROR', message: 'Erreur lors de la sauvegarde' });
                    });
                break;
            }

            case 'START_SESSION':
            case 'SWITCH_PROJECT': {
                // Sauvegarder la nouvelle session
                const newSession = model.currentSession;
                if (newSession) {
                    storage.saveSession(newSession)
                        .unsafePerformIO()
                        .then(() => {
                            console.log('✅ Session sauvegardée');
                        })
                        .catch(error => {
                            console.error('❌ Erreur sauvegarde session:', error);
                        });
                }
                break;
            }

            case 'STOP_SESSION': {
                // Mettre à jour la session arrêtée
                const stoppedSession = model.sessions.find(s => s.endTime !== null && !s.saved);
                if (stoppedSession) {
                    storage.saveSession(stoppedSession)
                        .unsafePerformIO()
                        .then(() => {
                            console.log('✅ Session arrêtée sauvegardée');
                        })
                        .catch(error => {
                            console.error('❌ Erreur sauvegarde session:', error);
                        });
                }
                break;
            }

            case 'DELETE_ENTRY': {
                storage.deleteEntry(msg.entryId)
                    .unsafePerformIO()
                    .then(() => {
                        console.log('✅ Entrée supprimée');
                        dispatch({ type: 'SUCCESS', message: 'Entrée supprimée' });
                    })
                    .catch(error => {
                        console.error('❌ Erreur suppression:', error);
                        dispatch({ type: 'ERROR', message: 'Erreur lors de la suppression' });
                    });
                break;
            }

            case 'CHANGE_DATE': {
                // Charger les entrées du nouveau jour
                dispatch({ type: 'SET_LOADING', isLoading: true });
                storage.getEntriesByDate(msg.date)
                    .unsafePerformIO()
                    .then(entries => {
                        dispatch({ type: 'ENTRIES_LOADED', entries });
                    })
                    .catch(error => {
                        console.error('❌ Erreur chargement:', error);
                        dispatch({ type: 'ERROR', message: 'Erreur lors du chargement' });
                    });
                break;
            }
        }
    };

    /**
     * Initialise le runtime
     * IMPURE: Charge les données initiales et démarre l'application
     * @param {string} rootSelector - Sélecteur CSS de l'élément racine
     */
    const init = async (rootSelector = '#app') => {
        console.log('🚀 Runtime démarré');

        // Trouver l'élément racine
        rootElement = document.querySelector(rootSelector);
        if (!rootElement) {
            throw new Error(`Élément racine "${rootSelector}" non trouvé`);
        }

        // Charger les données initiales si storage disponible
        if (effectHandlers.storage) {
            try {
                console.log('📦 Chargement des données initiales...');

                const storage = effectHandlers.storage;

                // Charger en parallèle
                const [entries, projects, sessions, currentSession] = await Promise.all([
                    storage.getEntriesByDate(currentModel.selectedDate).unsafePerformIO(),
                    storage.getAllProjects().unsafePerformIO(),
                    storage.getAllSessions().unsafePerformIO(),
                    storage.getCurrentSession().unsafePerformIO()
                ]);

                console.log('✅ Données chargées:', {
                    entries: entries.length,
                    projects: projects.length,
                    sessions: sessions.length,
                    currentSession: currentSession ? 'Oui' : 'Non'
                });

                // Mettre à jour le modèle avec les données
                currentModel = {
                    ...currentModel,
                    entries,
                    projects,
                    sessions,
                    currentSession
                };

                // Recalculer les stats
                currentModel = update({ type: 'ENTRIES_LOADED', entries }, currentModel);

                if (currentSession) {
                    currentModel = update(
                        { type: 'CURRENT_SESSION_LOADED', session: currentSession },
                        currentModel
                    );
                }
            } catch (error) {
                console.error('❌ Erreur chargement initial:', error);
            }
        }

        // Premier rendu
        render();

        // Démarrer le timer si session en cours
        if (currentModel.currentSession) {
            startTimer();
        }

        console.log('✅ Application démarrée');
    };

    /**
     * Démarre le timer pour la session en cours
     * IMPURE: setInterval
     */
    const startTimer = () => {
        const timerId = setInterval(() => {
            if (currentModel.currentSession) {
                const elapsed = Date.now() - currentModel.currentSession.startTime.getTime();
                dispatch({ type: 'TIMER_TICK', elapsed });
            } else {
                clearInterval(timerId);
            }
        }, 1000);

        effectHandlers.subscriptions.push(timerId);
    };

    /**
     * Obtient le modèle actuel (pour debugging)
     * @returns {Object} Modèle actuel
     */
    const getModel = () => currentModel;

    /**
     * Obtient l'historique (pour debugging / time-travel)
     * @returns {Array} Historique des messages
     */
    const getHistory = () => [...history];

    /**
     * Rejoue l'historique depuis le début (time-travel)
     * IMPURE: Met à jour le DOM
     * @param {number} toIndex - Index jusqu'où rejouer (-1 = tout)
     */
    const replayHistory = (toIndex = -1) => {
        const targetIndex = toIndex === -1 ? history.length : toIndex;
        let model = initialModel;

        for (let i = 0; i < targetIndex && i < history.length; i++) {
            const { msg } = history[i];
            model = update(msg, model);
        }

        currentModel = model;
        render();
        console.log(`⏮️  Historique rejoué jusqu'à ${targetIndex}`);
    };

    /**
     * Nettoie les ressources (subscriptions, timers)
     */
    const cleanup = () => {
        effectHandlers.subscriptions.forEach(id => clearInterval(id));
        effectHandlers.subscriptions = [];
        console.log('🧹 Runtime nettoyé');
    };

    // Retourner l'API publique du runtime
    return Object.freeze({
        init,
        dispatch,
        getModel,
        getHistory,
        replayHistory,
        cleanup
    });
};
