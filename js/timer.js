'use strict';

import { ProjectSession } from './project-session.js';

/**
 * Gestion du chronomètre pour les projets
 */
export class ProjectTimer {
    constructor(storage) {
        this.storage = storage;
        this.currentSession = null;
        this.updateInterval = null;
        this.onTick = null; // Callback appelé chaque seconde
        this.onStart = null; // Callback appelé au démarrage
        this.onStop = null; // Callback appelé à l'arrêt
    }

    /**
     * Initialise le timer (charge la session en cours s'il y en a une)
     */
    async init() {
        try {
            this.currentSession = await this.storage.getCurrentSession();

            if (this.currentSession) {
                console.log('⏱️ Session en cours trouvée:', this.currentSession.projectId);
                this.#startUpdateLoop();

                if (this.onStart) {
                    this.onStart(this.currentSession.projectId, this.currentSession.getDuration());
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du timer:', error);
            throw error;
        }
    }

    /**
     * Démarre le chronomètre pour un projet
     * @param {string} projectId - ID du projet
     * @returns {Promise<void>}
     * @throws {Error} Si un chronomètre est déjà en cours
     */
    async start(projectId) {
        try {
            // Vérifier qu'il n'y a pas déjà un chronomètre en cours
            if (this.currentSession) {
                throw new Error('Un chronomètre est déjà en cours. Arrêtez-le avant d\'en démarrer un nouveau.');
            }

            // Créer une nouvelle session
            this.currentSession = new ProjectSession(projectId);

            // Sauvegarder dans IndexedDB
            await this.storage.saveSession(this.currentSession);

            // Démarrer la boucle de mise à jour
            this.#startUpdateLoop();

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
     * Arrête le chronomètre en cours
     * @param {Date} endTime - Heure de fin optionnelle (par défaut: maintenant)
     * @returns {Promise<ProjectSession|null>} Session terminée ou null
     * @throws {Error} Si aucun chronomètre n'est en cours
     */
    async stop(endTime = new Date()) {
        try {
            if (!this.currentSession) {
                throw new Error('Aucun chronomètre n\'est en cours');
            }

            // Arrêter la session avec l'heure spécifiée
            this.currentSession.stop(endTime);

            // Sauvegarder dans IndexedDB
            await this.storage.saveSession(this.currentSession);

            // Arrêter la boucle de mise à jour
            this.#stopUpdateLoop();

            const finishedSession = this.currentSession;

            // Callback
            if (this.onStop) {
                this.onStop(finishedSession.projectId, finishedSession.getDuration());
            }

            console.log('⏹️ Chronomètre arrêté pour le projet:', finishedSession.projectId);
            console.log(`   Durée: ${Math.floor(finishedSession.getDuration() / 1000)} secondes`);

            // Réinitialiser
            this.currentSession = null;

            return finishedSession;
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du chronomètre:', error);
            throw error;
        }
    }

    /**
     * Bascule vers un autre projet (arrête le chronomètre actuel et en démarre un nouveau)
     * @param {string} newProjectId - ID du nouveau projet
     * @returns {Promise<void>}
     */
    async switchTo(newProjectId) {
        try {
            // Arrêter le chronomètre actuel s'il y en a un
            if (this.currentSession) {
                await this.stop();
            }

            // Démarrer un nouveau chronomètre
            await this.start(newProjectId);

            console.log('🔄 Basculé vers le projet:', newProjectId);
        } catch (error) {
            console.error('❌ Erreur lors du changement de projet:', error);
            throw error;
        }
    }

    /**
     * Récupère le temps écoulé de la session en cours
     * @returns {number} Durée en millisecondes (0 si aucune session)
     */
    getElapsedTime() {
        if (!this.currentSession) {
            return 0;
        }

        return this.currentSession.getDuration();
    }

    /**
     * Récupère l'ID du projet en cours
     * @returns {string|null} ID du projet ou null
     */
    getCurrentProjectId() {
        return this.currentSession ? this.currentSession.projectId : null;
    }

    /**
     * Vérifie si un chronomètre est en cours
     * @returns {boolean}
     */
    isRunning() {
        return this.currentSession !== null;
    }

    /**
     * Démarre la boucle de mise à jour (appelée chaque seconde)
     * @private
     */
    #startUpdateLoop() {
        this.#stopUpdateLoop(); // Arrêter l'ancienne boucle s'il y en a une

        this.updateInterval = setInterval(() => {
            if (this.currentSession && this.onTick) {
                const elapsed = this.currentSession.getDuration();
                this.onTick(this.currentSession.projectId, elapsed);
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
