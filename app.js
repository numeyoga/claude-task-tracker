/**
 * Claude Time Tracker
 * Application principale
 */

'use strict';

/**
 * Point d'entrée de l'application
 */
class App {
    constructor() {
        this.init();
    }

    /**
     * Initialise l'application
     */
    init() {
        console.log('Claude Time Tracker - Application démarrée');
        this.setupEventListeners();
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Les écouteurs seront ajoutés ici
    }
}

// Démarrage de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
