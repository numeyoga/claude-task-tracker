/**
 * Claude Time Tracker
 * Application principale
 */

'use strict';

import { StorageService } from './js/storage.js';
import { TimeEntry, ENTRY_TYPES } from './js/time-entry.js';
import { TimeCalculator } from './js/calculator.js';
import { TimeTrackerUI } from './js/ui.js';
import { getTodayDateString } from './js/utils.js';

/**
 * Contrôleur principal de l'application
 */
class App {
    constructor() {
        // Services
        this.storage = new StorageService();
        this.calculator = new TimeCalculator();
        this.ui = new TimeTrackerUI();

        // État
        this.todayEntries = [];
        this.updateInterval = null;

        // Initialisation
        this.init();
    }

    /**
     * Initialise l'application
     */
    async init() {
        try {
            console.log('🚀 Claude Time Tracker - Démarrage...');

            // Initialiser IndexedDB
            await this.storage.init();

            // Initialiser l'UI
            this.ui.init();

            // Charger les données du jour
            await this.loadTodayData();

            // Configurer les écouteurs d'événements
            this.setupEventListeners();

            // Démarrer la mise à jour en temps réel
            this.startRealtimeUpdate();

            console.log('✅ Application démarrée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.ui.showError('Erreur lors du démarrage de l\'application');
        }
    }

    // ======================
    // Chargement des données
    // ======================

    /**
     * Charge les pointages du jour
     */
    async loadTodayData() {
        try {
            const today = getTodayDateString();
            this.todayEntries = await this.storage.getEntriesByDate(today);

            console.log(`📅 ${this.todayEntries.length} pointage(s) chargé(s) pour aujourd'hui`);

            this.updateUI();
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    // ======================
    // Gestion des pointages
    // ======================

    /**
     * Enregistre un nouveau pointage
     * @param {string} entryType - Type de pointage (ENTRY_TYPES)
     */
    async recordEntry(entryType) {
        try {
            // Créer l'entrée
            const entry = new TimeEntry(entryType);

            // Sauvegarder dans IndexedDB
            await this.storage.saveEntry(entry);

            // Ajouter à la liste locale
            this.todayEntries.push(entry);

            // Mettre à jour l'UI
            this.updateUI();

            // Afficher un message de succès
            const labels = {
                [ENTRY_TYPES.CLOCK_IN]: 'Arrivée enregistrée',
                [ENTRY_TYPES.LUNCH_START]: 'Début de pause enregistré',
                [ENTRY_TYPES.LUNCH_END]: 'Fin de pause enregistrée',
                [ENTRY_TYPES.CLOCK_OUT]: 'Départ enregistré'
            };

            this.ui.showSuccess(labels[entryType] || 'Pointage enregistré');

            console.log('✅ Pointage enregistré:', entryType);
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement:', error);
            this.ui.showError('Erreur lors de l\'enregistrement du pointage');
        }
    }

    // ======================
    // Mise à jour de l'interface
    // ======================

    /**
     * Met à jour l'interface utilisateur avec les données actuelles
     */
    updateUI() {
        // Calculer le temps de présence
        const presenceTime = this.calculator.calculatePresenceTime(this.todayEntries);
        const percentage = this.calculator.getCompletionPercentage(presenceTime);
        const remainingTime = this.calculator.getRemainingTime(presenceTime);

        // Mettre à jour l'affichage du temps
        this.ui.updatePresenceDisplay(presenceTime, percentage, remainingTime);

        // Déterminer l'état du jour
        const dayStatus = this.calculator.getDayStatus(this.todayEntries);
        this.ui.updateDayStatus(dayStatus);

        // Déterminer le prochain pointage attendu
        const nextEntry = this.calculator.getNextExpectedEntry(this.todayEntries);
        this.ui.updateButtons(nextEntry);

        // Afficher la liste des pointages
        this.ui.renderEntries(this.todayEntries);
    }

    /**
     * Démarre la mise à jour en temps réel (toutes les secondes)
     * Utile pour afficher le temps qui s'écoule pendant la journée
     */
    startRealtimeUpdate() {
        // Mettre à jour toutes les secondes
        this.updateInterval = setInterval(() => {
            const dayStatus = this.calculator.getDayStatus(this.todayEntries);

            // Seulement si la journée est en cours (pas terminée)
            if (dayStatus !== 'completed' && dayStatus !== 'not-started') {
                const presenceTime = this.calculator.calculatePresenceTime(this.todayEntries);
                const percentage = this.calculator.getCompletionPercentage(presenceTime);
                const remainingTime = this.calculator.getRemainingTime(presenceTime);

                this.ui.updatePresenceDisplay(presenceTime, percentage, remainingTime);
            }
        }, 1000);
    }

    // ======================
    // Écouteurs d'événements
    // ======================

    /**
     * Configure les écouteurs d'événements des boutons
     */
    setupEventListeners() {
        // Bouton Arrivée
        this.ui.onButtonClick(ENTRY_TYPES.CLOCK_IN, () => {
            this.recordEntry(ENTRY_TYPES.CLOCK_IN);
        });

        // Bouton Début pause
        this.ui.onButtonClick(ENTRY_TYPES.LUNCH_START, () => {
            this.recordEntry(ENTRY_TYPES.LUNCH_START);
        });

        // Bouton Fin pause
        this.ui.onButtonClick(ENTRY_TYPES.LUNCH_END, () => {
            this.recordEntry(ENTRY_TYPES.LUNCH_END);
        });

        // Bouton Départ
        this.ui.onButtonClick(ENTRY_TYPES.CLOCK_OUT, () => {
            this.recordEntry(ENTRY_TYPES.CLOCK_OUT);
        });

        console.log('✅ Écouteurs d\'événements configurés');
    }
}

// Démarrage de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
