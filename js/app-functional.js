'use strict';

/**
 * Point d'entrée de l'application fonctionnelle
 * Architecture 100% fonctionnelle avec runtime Elm
 */

import { createRuntime } from './core/runtime.js';
import { initialModel } from './model/model.js';
import { update } from './update/update.js';
import { view } from './view/view.js';
import { initDatabase, createStorageEffects } from './effects/storage.js';

/**
 * Démarre l'application
 */
const startApp = async () => {
    try {
        console.log('🚀 Démarrage de l\'application fonctionnelle...');

        // 1. Initialiser la base de données
        const db = await initDatabase().unsafePerformIO();

        // 2. Créer les effets de stockage
        const storage = createStorageEffects(db);

        // 3. Créer le runtime avec les effets
        const runtime = createRuntime(initialModel, update, view, { storage });

        // 4. Initialiser le runtime (charge les données et démarre l'app)
        await runtime.init('#app');

        // 5. Exposer le runtime pour debugging
        window.__RUNTIME__ = runtime;
        window.__DEBUG__ = {
            getModel: () => runtime.getModel(),
            getHistory: () => runtime.getHistory(),
            replay: (index) => runtime.replayHistory(index),
            dispatch: (msg) => runtime.dispatch(msg)
        };

        console.log('✅ Application démarrée avec succès !');
        console.log('💡 Debug: window.__DEBUG__ pour accéder aux outils de debugging');
        console.log('💡 Time-travel: window.__DEBUG__.replay(index)');
        console.log('💡 État actuel: window.__DEBUG__.getModel()');
        console.log('💡 Historique: window.__DEBUG__.getHistory()');

    } catch (error) {
        console.error('❌ Erreur lors du démarrage:', error);
        document.getElementById('app').innerHTML = `
            <div style="padding: 2rem; color: red; font-family: monospace;">
                <h2>Erreur de démarrage</h2>
                <p>${error.message}</p>
                <pre>${error.stack}</pre>
            </div>
        `;
    }
};

// Démarrer quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
