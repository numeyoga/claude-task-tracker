'use strict';

import { ProjectSession } from './project-session.js';

/**
 * Gestion du chronomètre pour les projets
 * Supporte le mode multi-projet (plusieurs sessions simultanées)
 */
export class ProjectTimer {
    constructor(storage) {
        this.storage = storage;
        this.currentSessions = []; // Tableau de sessions actives
        this.updateInterval = null;
        this.multiProjectMode = false; // Mode multi-projet désactivé par défaut

        // Callbacks
        this.onTick = null; // Callback appelé chaque seconde
        this.onStart = null; // Callback appelé au démarrage
        this.onStop = null; // Callback appelé à l'arrêt
        this.onModeChange = null; // Callback appelé lors du changement de mode
    }

    /**
     * Initialise le timer (charge les sessions en cours s'il y en a)
     */
    async init() {
        try {
            // Charger le mode multi-projet depuis localStorage
            this.multiProjectMode = localStorage.getItem('multiProjectMode') === 'true';

            // Charger toutes les sessions en cours
            this.currentSessions = await this.storage.getCurrentSessions();

            if (this.currentSessions.length > 0) {
                console.log(`⏱️ ${this.currentSessions.length} session(s) en cours trouvée(s)`);
                this.#startUpdateLoop();

                if (this.onStart) {
                    this.currentSessions.forEach(session => {
                        this.onStart(session.projectId, session.getDuration());
                    });
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du timer:', error);
            throw error;
        }
    }

    /**
     * Active ou désactive le mode multi-projet
     * @param {boolean} enabled - true pour activer, false pour désactiver
     */
    setMultiProjectMode(enabled) {
        this.multiProjectMode = enabled;
        localStorage.setItem('multiProjectMode', enabled.toString());

        console.log(`🔄 Mode multi-projet ${enabled ? 'activé' : 'désactivé'}`);

        if (this.onModeChange) {
            this.onModeChange(enabled);
        }
    }

    /**
     * Vérifie si le mode multi-projet est actif
     * @returns {boolean}
     */
    isMultiProjectMode() {
        return this.multiProjectMode;
    }

    /**
     * Démarre le chronomètre pour un projet
     * @param {string} projectId - ID du projet
     * @returns {Promise<void>}
     * @throws {Error} Si le mode mono-projet et qu'un chronomètre est déjà en cours
     */
    async start(projectId) {
        try {
            // Vérifier si ce projet a déjà une session en cours
            const existingSession = this.currentSessions.find(s => s.projectId === projectId);
            if (existingSession) {
                console.log('⚠️ Une session existe déjà pour ce projet');
                return;
            }

            // En mode mono-projet, vérifier qu'il n'y a pas déjà un chronomètre en cours
            if (!this.multiProjectMode && this.currentSessions.length > 0) {
                throw new Error('Un chronomètre est déjà en cours. Activez le mode multi-projet ou arrêtez-le avant d\'en démarrer un nouveau.');
            }

            // Créer une nouvelle session
            const newSession = new ProjectSession(projectId);

            // Sauvegarder dans IndexedDB
            await this.storage.saveSession(newSession);

            // Ajouter à la liste des sessions actives
            this.currentSessions.push(newSession);

            // Démarrer la boucle de mise à jour si c'est la première session
            if (this.currentSessions.length === 1) {
                this.#startUpdateLoop();
            }

            // Callback
            if (this.onStart) {
                this.onStart(projectId, 0);
            }

            console.log('▶️ Chronomètre démarré pour le projet:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du chronomètre:', error);
            throw error;
        }
    }

    /**
     * Arrête le chronomètre pour un projet spécifique
     * @param {string} projectId - ID du projet (optionnel, si non fourni arrête la première session)
     * @param {Date} endTime - Heure de fin optionnelle (par défaut: maintenant)
     * @returns {Promise<ProjectSession|null>} Session terminée ou null
     */
    async stop(projectId = null, endTime = new Date()) {
        try {
            let sessionToStop;

            if (projectId) {
                // Trouver la session du projet spécifié
                sessionToStop = this.currentSessions.find(s => s.projectId === projectId);
            } else {
                // Prendre la première session (comportement par défaut)
                sessionToStop = this.currentSessions[0];
            }

            if (!sessionToStop) {
                throw new Error('Aucun chronomètre n\'est en cours' + (projectId ? ' pour ce projet' : ''));
            }

            // Arrêter la session avec l'heure spécifiée
            sessionToStop.stop(endTime);

            // Sauvegarder dans IndexedDB
            await this.storage.saveSession(sessionToStop);

            // Retirer de la liste des sessions actives
            this.currentSessions = this.currentSessions.filter(s => s.id !== sessionToStop.id);

            // Arrêter la boucle de mise à jour s'il n'y a plus de sessions
            if (this.currentSessions.length === 0) {
                this.#stopUpdateLoop();
            }

            // Callback
            if (this.onStop) {
                this.onStop(sessionToStop.projectId, sessionToStop.getDuration());
            }

            console.log('⏹️ Chronomètre arrêté pour le projet:', sessionToStop.projectId);
            console.log(`   Durée: ${Math.floor(sessionToStop.getDuration() / 1000)} secondes`);

            return sessionToStop;
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du chronomètre:', error);
            throw error;
        }
    }

    /**
     * Arrête tous les chronomètres en cours
     * @param {Date} endTime - Heure de fin optionnelle (par défaut: maintenant)
     * @returns {Promise<ProjectSession[]>} Sessions terminées
     */
    async stopAll(endTime = new Date()) {
        const stoppedSessions = [];

        while (this.currentSessions.length > 0) {
            const session = await this.stop(null, endTime);
            if (session) {
                stoppedSessions.push(session);
            }
        }

        return stoppedSessions;
    }

    /**
     * Bascule vers un autre projet (arrête le chronomètre actuel et en démarre un nouveau)
     * En mode mono-projet uniquement
     * @param {string} newProjectId - ID du nouveau projet
     * @returns {Promise<void>}
     */
    async switchTo(newProjectId) {
        try {
            if (this.multiProjectMode) {
                // En mode multi-projet, juste démarrer le nouveau projet
                await this.start(newProjectId);
            } else {
                // En mode mono-projet, arrêter d'abord le chronomètre actuel
                if (this.currentSessions.length > 0) {
                    await this.stop();
                }

                // Démarrer un nouveau chronomètre
                await this.start(newProjectId);
            }

            console.log('🔄 Basculé vers le projet:', newProjectId);
        } catch (error) {
            console.error('❌ Erreur lors du changement de projet:', error);
            throw error;
        }
    }

    /**
     * Récupère le temps écoulé total de toutes les sessions en cours
     * @returns {number} Durée totale en millisecondes
     */
    getTotalElapsedTime() {
        return this.currentSessions.reduce((total, session) => total + session.getDuration(), 0);
    }

    /**
     * Récupère le temps écoulé de la première session en cours (pour compatibilité)
     * @returns {number} Durée en millisecondes (0 si aucune session)
     */
    getElapsedTime() {
        if (this.currentSessions.length === 0) {
            return 0;
        }

        return this.currentSessions[0].getDuration();
    }

    /**
     * Récupère le temps écoulé pour un projet spécifique
     * @param {string} projectId - ID du projet
     * @returns {number} Durée en millisecondes (0 si pas de session)
     */
    getElapsedTimeForProject(projectId) {
        const session = this.currentSessions.find(s => s.projectId === projectId);
        return session ? session.getDuration() : 0;
    }

    /**
     * Récupère l'ID du premier projet en cours (pour compatibilité)
     * @returns {string|null} ID du projet ou null
     */
    getCurrentProjectId() {
        return this.currentSessions.length > 0 ? this.currentSessions[0].projectId : null;
    }

    /**
     * Récupère les IDs de tous les projets en cours
     * @returns {string[]} IDs des projets
     */
    getCurrentProjectIds() {
        return this.currentSessions.map(s => s.projectId);
    }

    /**
     * Récupère toutes les sessions en cours
     * @returns {ProjectSession[]}
     */
    getCurrentSessions() {
        return [...this.currentSessions];
    }

    /**
     * Vérifie si un chronomètre est en cours
     * @returns {boolean}
     */
    isRunning() {
        return this.currentSessions.length > 0;
    }

    /**
     * Vérifie si un projet spécifique a un chronomètre en cours
     * @param {string} projectId - ID du projet
     * @returns {boolean}
     */
    isRunningForProject(projectId) {
        return this.currentSessions.some(s => s.projectId === projectId);
    }

    /**
     * Récupère le nombre de sessions actives
     * @returns {number}
     */
    getActiveSessionCount() {
        return this.currentSessions.length;
    }

    /**
     * Démarre la boucle de mise à jour (appelée chaque seconde)
     * @private
     */
    #startUpdateLoop() {
        this.#stopUpdateLoop(); // Arrêter l'ancienne boucle s'il y en a une

        this.updateInterval = setInterval(() => {
            if (this.currentSessions.length > 0 && this.onTick) {
                // Appeler onTick pour chaque session active
                this.currentSessions.forEach(session => {
                    const elapsed = session.getDuration();
                    this.onTick(session.projectId, elapsed);
                });
            }
        }, 1000); // Mise à jour chaque seconde
    }

    /**
     * Arrête la boucle de mise à jour
     * @private
     */
    #stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Nettoie les ressources (à appeler lors de la fermeture de l'app)
     */
    cleanup() {
        this.#stopUpdateLoop();
    }
}
