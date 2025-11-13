import { test, expect } from '@playwright/test';

/**
 * Tests E2E qui exécutent tous les tests unitaires
 * et vérifient qu'ils passent tous
 */

test.describe('Tests unitaires', () => {
  test('Tous les tests unitaires passent', async ({ page }) => {
    // Collecter les logs de la console
    const consoleLogs = [];
    const consoleErrors = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Charger la page de tests
    await page.goto('/tests/test-runner.html');

    // Attendre que les tests se chargent et s'exécutent
    // On attend de voir le message final dans les logs
    await page.waitForTimeout(10000); // 10 secondes pour les tests IndexedDB

    // Vérifier qu'il n'y a pas d'erreurs JavaScript
    expect(consoleErrors.length).toBe(0);

    // Vérifier que les tests ont été exécutés
    const hasTestExecution = consoleLogs.some(log =>
      log.includes('Exécution des tests') || log.includes('🧪')
    );
    expect(hasTestExecution).toBeTruthy();

    // Vérifier qu'on a le message de succès final
    const hasSuccessMessage = consoleLogs.some(log =>
      log.includes('Tous les tests sont passés') ||
      log.includes('Tous les tests ont été exécutés')
    );
    expect(hasSuccessMessage).toBeTruthy();

    // Vérifier qu'il n'y a pas de tests échoués (❌)
    const hasFailedTests = consoleLogs.some(log => log.includes('❌'));

    if (hasFailedTests) {
      // Afficher les logs pour le débogage
      console.log('='.repeat(60));
      console.log('Console logs:');
      consoleLogs.forEach(log => console.log(log));
      console.log('='.repeat(60));
    }

    expect(hasFailedTests).toBe(false);

    // Vérifier qu'il y a des tests réussis (✅)
    const hasPassedTests = consoleLogs.some(log => log.includes('✅'));
    expect(hasPassedTests).toBeTruthy();
  });
});

test.describe('Application principale', () => {
  test('La page principale se charge correctement', async ({ page }) => {
    await page.goto('/');

    // Vérifier le titre
    await expect(page).toHaveTitle('Claude Time Tracker');

    // Vérifier que le header est présent
    const header = page.locator('.header__title');
    await expect(header).toBeVisible();
    await expect(header).toHaveText('Claude Time Tracker');

    // Vérifier que les boutons de pointage sont présents
    const clockInBtn = page.locator('#clock-in-btn');
    await expect(clockInBtn).toBeVisible();

    // Vérifier que le statut du jour est affiché
    const dayStatus = page.locator('#day-status');
    await expect(dayStatus).toBeVisible();
  });

  test('Le bouton Arrivée est actif au démarrage', async ({ page }) => {
    await page.goto('/');

    // Attendre que l'application soit initialisée
    await page.waitForTimeout(1000);

    // Le bouton Arrivée doit être actif
    const clockInBtn = page.locator('#clock-in-btn');
    await expect(clockInBtn).not.toBeDisabled();

    // Les autres boutons doivent être désactivés
    const lunchStartBtn = page.locator('#lunch-start-btn');
    const lunchEndBtn = page.locator('#lunch-end-btn');
    const clockOutBtn = page.locator('#clock-out-btn');

    await expect(lunchStartBtn).toBeDisabled();
    await expect(lunchEndBtn).toBeDisabled();
    await expect(clockOutBtn).toBeDisabled();
  });

  test('Le cycle de pointage complet fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // 1. Clock in
    const clockInBtn = page.locator('#clock-in-btn');
    await clockInBtn.click();

    // Vérifier le toast de succès
    const toast = page.locator('.toast--success');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Arrivée enregistrée');

    // Attendre que le toast disparaisse
    await page.waitForTimeout(3500);

    // 2. Vérifier que le bouton "Début pause" est maintenant actif
    const lunchStartBtn = page.locator('#lunch-start-btn');
    await expect(lunchStartBtn).not.toBeDisabled();
    await lunchStartBtn.click();

    // 3. Vérifier que le bouton "Fin pause" est maintenant actif
    const lunchEndBtn = page.locator('#lunch-end-btn');
    await page.waitForTimeout(500);
    await expect(lunchEndBtn).not.toBeDisabled();
    await lunchEndBtn.click();

    // 4. Vérifier que le bouton "Départ" est maintenant actif
    const clockOutBtn = page.locator('#clock-out-btn');
    await page.waitForTimeout(500);
    await expect(clockOutBtn).not.toBeDisabled();
    await clockOutBtn.click();

    // 5. Vérifier que tous les boutons sont désactivés (journée terminée)
    await page.waitForTimeout(500);
    await expect(clockInBtn).toBeDisabled();
    await expect(lunchStartBtn).toBeDisabled();
    await expect(lunchEndBtn).toBeDisabled();
    await expect(clockOutBtn).toBeDisabled();

    // 6. Vérifier que les 4 pointages sont affichés dans la liste
    const entries = page.locator('.entries-list__item');
    await expect(entries).toHaveCount(4);
  });

  test('Le temps de présence se met à jour en temps réel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Clock in
    const clockInBtn = page.locator('#clock-in-btn');
    await clockInBtn.click();

    // Attendre que le toast disparaisse
    await page.waitForTimeout(3500);

    // Récupérer le temps initial
    const presenceTime = page.locator('#presence-time');
    const initialTime = await presenceTime.textContent();

    // Attendre 3 secondes
    await page.waitForTimeout(3000);

    // Vérifier que le temps a changé
    const newTime = await presenceTime.textContent();
    expect(newTime).not.toBe(initialTime);
  });
});

test.describe('Accessibilité et performance', () => {
  test('La page principale respecte les bonnes pratiques', async ({ page }) => {
    await page.goto('/');

    // Vérifier qu'il n'y a pas d'erreurs JavaScript
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.waitForTimeout(2000);

    expect(errors.length).toBe(0);
  });

  test('Les ressources se chargent correctement', async ({ page }) => {
    const failedRequests = [];

    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Vérifier qu'aucune requête n'a échoué
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }

    expect(failedRequests.length).toBe(0);
  });
});
