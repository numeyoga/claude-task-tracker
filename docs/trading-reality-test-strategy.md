# Stratégie de Test "Trading Reality"

## Document de Recherche et Guide d'Implémentation

---

## 1. Introduction

### 1.1 Contexte

TradeGuard est un système de trading algorithmique event-driven qui gère de l'argent réel. Cette réalité impose des contraintes uniques en matière de tests :

- **Risque financier direct** : Un bug peut entraîner des pertes monétaires
- **Interactions avec des API tierces** : Brokers (Oanda, Interactive Brokers)
- **Latence critique** : Le timing est crucial en trading
- **Event sourcing** : L'état se reconstruit à partir d'événements

### 1.2 Philosophie Fondamentale

> "Tester comme on trade : avec un mix de simulation et de réalité, en protégeant le capital"

Cette philosophie repose sur trois piliers :

1. **Pragmatisme** : Pas de dogmatisme sur la couverture de test
2. **Protection** : Le capital est sacré, jamais de test sur Live
3. **Réalisme** : Les mocks peuvent diverger de la réalité, il faut le détecter

---

## 2. Pourquoi cette Stratégie ?

### 2.1 Limites des Approches Classiques

#### Approche "100% Mock" (Rejetée)

| Problème | Conséquence |
|----------|-------------|
| Drift mock/réalité | Les mocks finissent par diverger de l'API réelle |
| Fausse confiance | Les tests passent mais le système échoue en production |
| Maintenance lourde | Chaque changement API nécessite une mise à jour manuelle |
| Cas limites ignorés | Les edge cases du broker ne sont pas simulés |

**Exemple concret** : Un mock retourne toujours `status: "FILLED"` en 10ms. En réalité, Oanda peut retourner `status: "PENDING"` pendant plusieurs secondes lors de forte volatilité.

#### Approche "100% Réel" (Rejetée)

| Problème | Conséquence |
|----------|-------------|
| Coût prohibitif | Tests E2E = ordres réels = commissions |
| Lenteur | Attendre les fills réels prend du temps |
| Fragilité | API down = CI cassée |
| Risque | Même sur Demo, des bugs peuvent créer des situations complexes |

### 2.2 Justification de la Répartition 40/30/20/10

```
   Tests Unitaires (40%)     ←── Rapidité + Couverture métier
   └─ Calculs critiques, déterministes

   Tests IT Mock (30%)       ←── Rapidité + Orchestration
   └─ Flux de données, event sourcing

   Tests IT Contract (20%)   ←── Réalisme + Maintenance auto
   └─ Validation API, génération fixtures

   Tests E2E Demo (10%)      ←── Confiance + Validation finale
   └─ Smoke tests quotidiens
```

#### Pourquoi 40% Unitaires ?

Les calculs financiers sont le coeur du système :
- **Position sizing** : Calcul de la taille de position selon le risque
- **P&L** : Profit and Loss en temps réel
- **Indicateurs techniques** : RSI, MACD, Bollinger, etc.
- **Trailing stops** : Ajustement dynamique des stops

Ces calculs sont **purs** (déterministes, sans effets de bord) et doivent être testés exhaustivement.

#### Pourquoi 30% IT Mock ?

L'orchestration event-driven nécessite de tester les flux :
- Signal détecté → Ordre créé → Ordre rempli → Position ouverte
- Gestion multi-compte
- Retry avec backoff exponentiel
- Reconstruction d'état via event replay

Les mocks simples suffisent ici car on teste l'orchestration, pas l'API.

#### Pourquoi 20% Contract Testing ?

C'est l'innovation clé de cette stratégie :
- Valide que l'API broker n'a pas changé
- Génère automatiquement des fixtures à jour
- Détecte proactivement les breaking changes
- Maintient les mocks synchronisés avec la réalité

#### Pourquoi 10% E2E Demo ?

Le minimum nécessaire pour la confiance :
- Smoke test quotidien avec vrai broker
- Validation de bout en bout
- Budget risque contrôlé (< 1 USD/test)

---

## 3. Architecture : Broker Adapter Pattern

### 3.1 Principe Fondamental

**Un seul code de test, plusieurs implémentations broker.**

```
┌─────────────────────────────────────────────────────────────┐
│                     TEST CODE                                │
│                                                              │
│   test "should execute order and create position"           │
│       order = broker.place_order(...)                       │
│       assert order.status == :filled                        │
│       position = broker.get_position(order.id)              │
│       assert position != nil                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BROKER ADAPTER INTERFACE                   │
│                                                              │
│   - place_order(instrument, units, side, type, ...)        │
│   - get_order(order_id)                                     │
│   - cancel_order(order_id)                                  │
│   - get_position(position_id)                               │
│   - get_account()                                           │
│   - stream_prices(instruments, callback)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   MockBroker  │  │ RecordBroker  │  │   RealBroker  │
│               │  │               │  │               │
│ Réponses      │  │ Enregistre    │  │ Oanda API     │
│ programmées   │  │ pour replay   │  │ Demo/Live     │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        │                  ▼                  │
        │          ┌───────────────┐          │
        │          │  PaperBroker  │          │
        │          │               │          │
        │          │ Simulation    │          │
        │          │ locale        │          │
        │          └───────────────┘          │
        │                                     │
        └─────────────────────────────────────┘
              Tous implémentent la même interface
```

### 3.2 Types d'Adapters

#### MockBroker

**Usage** : Tests IT rapides

**Caractéristiques** :
- Réponses pré-programmées (fixtures)
- Pas de logique complexe
- Exécution instantanée
- Parfait pour tester l'orchestration

**Comportement** :
```
place_order() → Retourne fixture "order_filled.json"
get_position() → Retourne fixture "position_open.json"
```

#### RecordingBroker

**Usage** : Génération de fixtures, debugging

**Caractéristiques** :
- Wrapper autour de RealBroker
- Enregistre toutes les requêtes/réponses
- Permet le replay exact
- Utile pour reproduire des bugs

**Comportement** :
```
place_order() → Appelle RealBroker → Enregistre requête/réponse → Retourne
```

#### PaperBroker

**Usage** : Tests de simulation avancés, backtesting

**Caractéristiques** :
- Simulation locale complète
- Gère slippage, latence simulée
- Matching engine basique
- Pas de connexion réseau

**Comportement** :
```
place_order() → Simule le fill avec slippage réaliste → Retourne
```

#### RealBroker

**Usage** : Contract tests, E2E Demo

**Caractéristiques** :
- Connexion réelle à Oanda API
- Mode Demo uniquement pour tests automatisés
- Mode Live réservé à la production

---

## 4. Détail des Couches de Test

### 4.1 Tests Unitaires (40%)

#### Domaines à Couvrir

| Domaine | Couverture Cible | Technique |
|---------|------------------|-----------|
| Risk Management | 100% | Property-based testing |
| P&L Calculation | 100% | Tables de vérité |
| Indicateurs Techniques | 100% | Validation vs TA-Lib |
| Position Sizing | 100% | Boundary testing |
| Order Validation | 100% | Exhaustive cases |

#### Property-Based Testing pour le Risk

Le position sizing est un candidat idéal pour le property-based testing :

**Propriétés à vérifier** :
1. `position_size * pip_value * stop_distance <= max_risk`
2. `position_size >= min_trade_size` (broker constraint)
3. `position_size <= max_position_size` (account constraint)
4. `position_size` est toujours positif ou zéro

**Générateurs de données** :
- Account balance : [1000, 100000] USD
- Risk percentage : [0.5%, 5%]
- Stop distance : [10, 500] pips
- Instrument : EUR/USD, GBP/USD, USD/JPY (pip values différentes)

#### Validation des Indicateurs Techniques

**Problème** : Les indicateurs (RSI, MACD, etc.) ont des implémentations variées.

**Solution** : Validation croisée avec des librairies de référence.

| Indicateur | Référence | Dataset de validation |
|------------|-----------|----------------------|
| RSI | TA-Lib, pandas-ta | 1000 bougies EUR/USD |
| MACD | TA-Lib | 1000 bougies EUR/USD |
| Bollinger | TA-Lib | 1000 bougies EUR/USD |
| EMA/SMA | pandas-ta | Calcul manuel vérifié |

**Workflow** :
1. Exécuter l'indicateur de référence sur le dataset
2. Sauvegarder les résultats attendus
3. Comparer avec notre implémentation
4. Tolérance : ±0.0001 pour les arrondis flottants

#### Tables de Vérité pour le P&L

Construire des scénarios exhaustifs :

| Scénario | Direction | Entry | Exit | Units | Expected P&L |
|----------|-----------|-------|------|-------|--------------|
| Long profitable | BUY | 1.1000 | 1.1050 | 10000 | +50 USD |
| Long perdant | BUY | 1.1000 | 1.0950 | 10000 | -50 USD |
| Short profitable | SELL | 1.1000 | 1.0950 | 10000 | +50 USD |
| Short perdant | SELL | 1.1000 | 1.1050 | 10000 | -50 USD |
| Avec swap | BUY | 1.1000 | 1.1050 | 10000 | +50 - swap |
| Avec commission | BUY | 1.1000 | 1.1050 | 10000 | +50 - comm |

### 4.2 Tests IT avec Mock (30%)

#### Focus : Orchestration Event-Driven

**Ce qu'on teste** :
- Le flux de messages entre composants
- La gestion d'état via event sourcing
- Les patterns de retry et backoff
- L'isolation multi-compte

**Ce qu'on NE teste PAS** :
- Le comportement exact du broker
- Les calculs financiers (déjà couverts en unitaire)

#### Patterns de Mock Simples

**Principe** : Les mocks ne doivent pas avoir de logique. Ils retournent des réponses fixes.

**Mock "Happy Path"** :
```
place_order() → {:ok, %Order{status: :filled}}
get_position() → {:ok, %Position{...}}
```

**Mock "Rejection Path"** :
```
place_order() → {:error, :insufficient_margin}
```

**Mock "Timeout Path"** :
```
place_order() → timeout après 5 secondes
```

#### Scénarios à Couvrir

1. **Flux complet** :
   - Signal → Order → Fill → Position → Exit

2. **Retry avec backoff** :
   - Première tentative échoue
   - Retry après 1s
   - Retry après 2s
   - Succès ou abandon

3. **Multi-compte** :
   - 4 comptes simultanés
   - Chaque compte a son propre état
   - Aucune fuite entre comptes

4. **Event replay** :
   - Sauvegarder N événements
   - Reconstruire l'état
   - Vérifier cohérence

### 4.3 Contract Testing (20%)

#### Concept Clé

> Tester les contrats d'API contre le vrai broker, puis générer des fixtures automatiquement.

#### Structure d'un Contrat

```yaml
contract: GetAccountDetails
version: 1.0
broker: oanda

request:
  method: GET
  endpoint: /v3/accounts/{account_id}
  headers:
    Authorization: Bearer {token}
    Content-Type: application/json

response:
  status: 200
  schema:
    account:
      id: string
      alias: string
      currency: string
      balance: number
      openTradeCount: integer
      openPositionCount: integer
      pl: number
      unrealizedPL: number
      marginRate: number

validations:
  - response.status == 200
  - response.account.id == request.account_id
  - response.account.balance >= 0
  - response.account.currency in ["USD", "EUR", "GBP"]
```

#### Workflow de Contract Testing

```
┌─────────────────────────────────────────────────────────────┐
│                    NIGHTLY CI/CD JOB                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              1. CHARGER TOUS LES CONTRATS                    │
│                                                              │
│   contracts/                                                 │
│   ├── get_account.yaml                                      │
│   ├── place_order.yaml                                      │
│   ├── get_positions.yaml                                    │
│   └── stream_prices.yaml                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         2. EXÉCUTER CONTRE BROKER DEMO                       │
│                                                              │
│   Pour chaque contrat:                                       │
│     - Effectuer la requête réelle                           │
│     - Valider le schema de réponse                          │
│     - Vérifier les assertions                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
┌───────────────────────┐     ┌───────────────────────┐
│   CONTRAT VALIDÉ ✓    │     │   CONTRAT ÉCHOUÉ ✗    │
│                       │     │                       │
│ → Enregistrer réponse │     │ → Alerter équipe      │
│ → Mettre à jour       │     │ → Bloquer pipeline    │
│   fixtures            │     │ → Investiguer         │
└───────────────────────┘     └───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│            3. GÉNÉRER/METTRE À JOUR FIXTURES                 │
│                                                              │
│   fixtures/                                                  │
│   ├── get_account_success.json      (auto-généré)           │
│   ├── place_order_filled.json       (auto-généré)           │
│   └── stream_prices_sample.json     (auto-généré)           │
└─────────────────────────────────────────────────────────────┘
```

#### Avantages du Contract Testing

| Avantage | Explication |
|----------|-------------|
| Détection précoce | Changement d'API détecté avant impact production |
| Fixtures à jour | Plus de drift mock/réalité |
| Documentation vivante | Les contrats documentent l'API |
| Confiance | On sait que nos mocks sont réalistes |

#### Contrats Essentiels pour TradeGuard

1. **Authentication**
   - Token refresh
   - Token expiration handling

2. **Account Management**
   - Get account details
   - Get account summary

3. **Orders**
   - Place market order
   - Place limit order
   - Place stop order
   - Cancel order
   - Get order status

4. **Positions**
   - Get open positions
   - Close position
   - Modify position (SL/TP)

5. **Market Data**
   - Get candles (OHLC)
   - Stream prices (WebSocket)

6. **Rate Limits**
   - Verify rate limit headers
   - Test throttling behavior

### 4.4 Tests E2E sur Demo (10%)

#### Smoke Test Quotidien

**Objectif** : Valider que le système fonctionne de bout en bout.

**Scénario** :
1. Se connecter à Oanda Demo
2. Récupérer le prix EUR/USD
3. Calculer signal RSI
4. Placer un ordre avec SL/TP
5. Attendre le fill (timeout 30s)
6. Vérifier la position créée
7. Attendre SL ou TP ou timeout (15 min max)
8. Clôturer si toujours ouvert

**Budget risque** :
- Position size : Minimum tradable (1 micro-lot)
- Stop loss : 10 pips
- Risque max : ~0.50 USD

**Critères de succès** :
- Tous les appels API réussis
- Position créée correctement
- SL/TP correctement placés
- Clôture propre

#### Test Multi-Compte Hebdomadaire

**Objectif** : Vérifier l'isolation entre comptes.

**Scénario** :
1. Initialiser 2 comptes Demo
2. Compte A : Stratégie RSI sur EUR/USD
3. Compte B : Stratégie MACD sur GBP/USD
4. Exécuter en parallèle pendant 30 min
5. Vérifier qu'aucune position n'est croisée
6. Vérifier les logs séparés

#### Test de Reconnexion

**Objectif** : Valider la résilience réseau.

**Scénario** :
1. Établir connexion WebSocket streaming
2. Simuler coupure réseau (kill socket)
3. Mesurer temps de reconnexion
4. Vérifier aucune perte de données
5. Critère : Reconnexion < 5 secondes

---

## 5. Données de Test

### 5.1 Sources de Données

| Type | Source | Fréquence de Refresh | Usage |
|------|--------|---------------------|-------|
| OHLC Historique | Oanda API | Mensuel | Backtesting, indicateurs |
| Ticks Sample | Recording Demo | Hebdomadaire | P&L temps réel, trailing |
| API Fixtures | Contract Tests | Nightly | Tests IT |
| Edge Cases | Construits manuellement | Stable | Tests unitaires |
| TA-Lib Reference | Calcul one-time | Stable | Validation indicateurs |

### 5.2 Dataset de Référence

#### OHLC Historique

**Instruments** :
- EUR/USD : 5 ans de données (référence principale)
- GBP/USD : 3 ans
- USD/JPY : 3 ans
- XAU/USD (Gold) : 3 ans

**Granularités** :
- M1 (1 minute) : 3 mois récents
- M5 (5 minutes) : 1 an
- M15 (15 minutes) : 2 ans
- H1 (1 heure) : 5 ans
- D (daily) : 10 ans

**Format de stockage** :
```
datasets/
├── ohlc/
│   ├── EUR_USD/
│   │   ├── M1_2024.parquet
│   │   ├── M5_2023_2024.parquet
│   │   ├── H1_2020_2024.parquet
│   │   └── D_2015_2024.parquet
│   └── GBP_USD/
│       └── ...
```

#### Edge Cases Construits

| Catégorie | Exemples |
|-----------|----------|
| Limites numériques | Balance = 0, Position size max |
| Timestamps | Changement DST, weekend gap |
| Prix extrêmes | Flash crash, gap overnight |
| États invalides | Order sans instrument, Position négative |

---

## 6. Protection du Capital

### 6.1 Règles Strictes

```
╔═══════════════════════════════════════════════════════════════╗
║                    RÈGLES INVIOLABLES                          ║
╠═══════════════════════════════════════════════════════════════╣
║  ❌ JAMAIS de test automatisé sur compte Live                 ║
║  ❌ JAMAIS de credentials Live dans le code/CI                ║
║  ❌ JAMAIS de position size > micro-lot en test               ║
║  ✅ Tests E2E uniquement sur Demo                              ║
║  ✅ Budget max par test : 1 USD de risque                      ║
║  ✅ Kill switch si perte cumulée > seuil quotidien            ║
║  ✅ Fenêtres horaires pour tests E2E                          ║
╚═══════════════════════════════════════════════════════════════╝
```

### 6.2 Kill Switch Automatique

**Configuration** :
```yaml
e2e_safety:
  max_daily_loss: 10.00 USD
  max_position_size: 1000 units
  max_concurrent_positions: 2
  allowed_instruments:
    - EUR_USD
    - GBP_USD
  allowed_hours:
    start: "08:00 UTC"
    end: "20:00 UTC"
  weekend_trading: false
```

**Comportement** :
1. Avant chaque test E2E, vérifier le budget restant
2. Si `daily_loss >= max_daily_loss` → Arrêter tous les tests
3. Envoyer alerte à l'équipe
4. Reset du budget à minuit UTC

### 6.3 Isolation des Credentials

```
┌─────────────────────────────────────────────────────────────┐
│                   ENVIRONNEMENTS                             │
├─────────────────┬───────────────────┬───────────────────────┤
│   Development   │      CI/CD        │     Production        │
├─────────────────┼───────────────────┼───────────────────────┤
│ Mock seulement  │ Demo credentials  │ Live credentials      │
│ Pas de secrets  │ Vault sécurisé    │ HSM / Vault           │
│                 │ Rate limited      │ Accès restreint       │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## 7. Bonnes Pratiques

### 7.1 Organisation du Code de Test

```
test/
├── unit/                          # Tests unitaires (40%)
│   ├── risk/
│   │   ├── position_sizing_test.exs
│   │   └── risk_calculator_test.exs
│   ├── pnl/
│   │   └── pnl_calculator_test.exs
│   ├── indicators/
│   │   ├── rsi_test.exs
│   │   ├── macd_test.exs
│   │   └── bollinger_test.exs
│   └── orders/
│       └── order_validation_test.exs
│
├── integration/                    # Tests IT (30%)
│   ├── mock/
│   │   ├── order_flow_test.exs
│   │   ├── multi_account_test.exs
│   │   └── event_replay_test.exs
│   └── support/
│       ├── mock_broker.exs
│       └── fixtures/
│
├── contract/                       # Contract Tests (20%)
│   ├── contracts/
│   │   ├── get_account.yaml
│   │   ├── place_order.yaml
│   │   └── stream_prices.yaml
│   ├── generated_fixtures/        # Auto-généré
│   └── contract_runner.exs
│
└── e2e/                           # Tests E2E (10%)
    ├── smoke_test.exs
    ├── multi_account_test.exs
    ├── reconnection_test.exs
    └── support/
        └── demo_account_config.exs
```

### 7.2 Nommage des Tests

**Conventions** :
- Unitaires : `test "<fonction> <scénario> returns <résultat>"`
- IT : `test "<flux> when <condition> should <comportement>"`
- Contract : `contract "<endpoint> <opération>"`
- E2E : `test "E2E: <scénario utilisateur>"`

**Exemples** :
```
# Unitaire
test "calculate_position_size with 2% risk returns correct units"

# IT
test "order flow when broker rejects should retry with backoff"

# Contract
contract "POST /v3/accounts/{id}/orders creates order"

# E2E
test "E2E: complete trade cycle with RSI strategy"
```

### 7.3 Fixtures et Factories

**Principes** :
1. **Fixtures statiques** pour les réponses API (générées par contract tests)
2. **Factories dynamiques** pour les objets domaine
3. **Builders** pour les scénarios complexes

**Structure** :
```
test/support/
├── fixtures/                 # Réponses API statiques
│   ├── oanda/
│   │   ├── order_filled.json
│   │   ├── order_rejected.json
│   │   └── account_details.json
│   └── market_data/
│       └── eur_usd_candles.json
│
├── factories/               # Création d'objets
│   ├── order_factory.exs
│   ├── position_factory.exs
│   └── account_factory.exs
│
└── builders/                # Scénarios complexes
    ├── trade_scenario_builder.exs
    └── multi_account_builder.exs
```

### 7.4 Gestion du Temps dans les Tests

**Problème** : Le trading est time-sensitive (heures de marché, expirations, etc.)

**Solutions** :

1. **Injection du temps** :
   ```
   # Au lieu de DateTime.utc_now()
   clock.now()  # Injecté, mockable
   ```

2. **Time travel** pour les tests :
   ```
   # Simuler un moment précis
   with_frozen_time(~U[2024-01-15 14:30:00Z], fn ->
     # Le code voit cette heure
   end)
   ```

3. **Accélération du temps** pour les tests longs :
   ```
   # 1 heure de simulation en 1 seconde
   with_time_acceleration(3600, fn ->
     # Le temps passe 3600x plus vite
   end)
   ```

### 7.5 Isolation des Tests

**Règle d'or** : Chaque test doit être indépendant.

**Techniques** :
1. **Setup/Teardown** : Réinitialiser l'état avant/après
2. **Sandboxing** : Chaque test a son propre contexte isolé
3. **Identifiants uniques** : Utiliser des UUIDs pour éviter les collisions
4. **Nettoyage automatique** : Tags pour identifier les ressources de test

```yaml
# Pour E2E sur Demo
test_resource_tag: "test_{test_id}_{timestamp}"
cleanup_on_finish: true
max_resource_age: 1 hour
```

### 7.6 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   COMMIT    │ → │   UNIT      │ → │   IT MOCK   │ → │   BUILD     │
│             │   │   TESTS     │   │   TESTS     │   │   ARTIFACT  │
│             │   │   (40%)     │   │   (30%)     │   │             │
│             │   │   < 2 min   │   │   < 5 min   │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                                                             │
        ┌────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    NIGHTLY PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│   │  CONTRACT   │ → │  UPDATE     │ → │   E2E       │       │
│   │  TESTS      │   │  FIXTURES   │   │   DEMO      │       │
│   │  (20%)      │   │             │   │   (10%)     │       │
│   │  ~10 min    │   │             │   │   ~15 min   │       │
│   └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Justification** :
- Les tests unitaires et IT mock sont rapides → à chaque commit
- Les contract tests nécessitent l'API Demo → nightly
- Les E2E sont lents et utilisent du budget → nightly

---

## 8. Pistes d'Implémentation

### 8.1 Phase 1 : MVP (Semaines 1-2)

**Objectif** : Avoir une base de tests fonctionnelle.

**Actions** :
1. Créer l'interface BrokerAdapter
2. Implémenter MockBroker minimal
3. Écrire tests unitaires pour Risk et P&L
4. Écrire 5-10 tests IT avec MockBroker
5. Exécuter 1 test E2E manuel sur Demo

**Livrables** :
- [ ] Interface BrokerAdapter définie
- [ ] MockBroker avec 10 fixtures de base
- [ ] 30+ tests unitaires sur calculs critiques
- [ ] 10+ tests IT sur flux de base
- [ ] Documentation de la procédure E2E manuelle

### 8.2 Phase 2 : Contract Testing (Semaines 3-4)

**Objectif** : Automatiser la synchronisation mock/réalité.

**Actions** :
1. Définir le format de contrat (YAML)
2. Implémenter le contract runner
3. Créer les contrats pour les 10 endpoints principaux
4. Configurer le pipeline nightly
5. Mettre en place la génération automatique de fixtures

**Livrables** :
- [ ] 10 contrats définis
- [ ] Contract runner fonctionnel
- [ ] Pipeline nightly configuré
- [ ] Fixtures auto-générées
- [ ] Alerting sur contract failure

### 8.3 Phase 3 : E2E Automatisés (Semaines 5-6)

**Objectif** : Avoir une validation quotidienne automatique.

**Actions** :
1. Configurer le compte Demo dédié aux tests
2. Implémenter le kill switch de sécurité
3. Écrire le smoke test automatisé
4. Écrire le test multi-compte
5. Écrire le test de reconnexion
6. Intégrer au pipeline nightly

**Livrables** :
- [ ] Compte Demo configuré
- [ ] Kill switch fonctionnel
- [ ] 3 tests E2E automatisés
- [ ] Métriques de suivi (succès/échec/budget)
- [ ] Dashboard de monitoring

### 8.4 Phase 4 : Enrichissement (Semaines 7-8)

**Objectif** : Améliorer la couverture et la robustesse.

**Actions** :
1. Implémenter RecordingBroker
2. Implémenter PaperBroker avec simulation réaliste
3. Ajouter property-based testing (StreamData)
4. Enrichir les datasets de référence
5. Ajouter des tests de charge

**Livrables** :
- [ ] RecordingBroker fonctionnel
- [ ] PaperBroker avec slippage simulation
- [ ] 20+ properties testées
- [ ] 5 ans de données OHLC stockées
- [ ] Tests de charge documentés

---

## 9. Points d'Attention par Epic

### Epic 5 : Risk Management

**Criticité** : MAXIMALE

**Approche** :
- 100% couverture en tests unitaires
- Property-based testing obligatoire
- Tables de vérité exhaustives
- Revue de code obligatoire

**Scénarios à ne pas oublier** :
- Division par zéro (stop distance = 0)
- Overflow sur gros comptes
- Underflow sur micro-comptes
- Pip value pour paires exotiques

### Epic 6 : Order Management

**Criticité** : HAUTE

**Approche** :
- Tests unitaires pour validation
- Tests IT pour le flux complet
- Contract tests pour chaque type d'ordre

**Scénarios à ne pas oublier** :
- Ordre rejeté pour marge insuffisante
- Ordre expiré (GTC, GTD)
- Ordre partiellement rempli
- Ordre annulé pendant l'exécution

### Epic 2 : Market Data

**Criticité** : MOYENNE

**Approche** :
- Tests unitaires pour l'agrégation
- Contract tests pour le streaming
- Tests de reconnexion E2E

**Scénarios à ne pas oublier** :
- Gap de données (weekend, maintenance)
- Données out-of-order (réseau)
- Reconnexion après coupure
- Rate limiting sur historique

### Epic 14 : Event Store

**Criticité** : HAUTE

**Approche** :
- Tests unitaires pour serialisation
- Tests IT pour replay
- Tests de performance sur gros volumes

**Scénarios à ne pas oublier** :
- Reconstruction après crash
- Migration de schéma d'événement
- Compaction des événements
- Snapshot + événements incrémentaux

### Epic 16 : Broker Integration

**Criticité** : MAXIMALE

**Approche** :
- Contract testing sur TOUTES les opérations
- Tests de rate limiting
- Tests de retry avec backoff
- Tests d'authentification

**Scénarios à ne pas oublier** :
- Token expiré mid-session
- API en maintenance
- Rate limit atteint
- Réponse malformée du broker

---

## 10. Métriques et Monitoring

### 10.1 Métriques de Test

| Métrique | Cible | Alerte si |
|----------|-------|-----------|
| Couverture unitaire (Risk/P&L) | 100% | < 100% |
| Couverture unitaire (global) | > 70% | < 60% |
| Temps des tests unitaires | < 2 min | > 5 min |
| Temps des tests IT | < 5 min | > 10 min |
| Taux de succès contract tests | 100% | < 100% |
| Taux de succès E2E quotidien | > 95% | < 90% |
| Budget E2E restant | > 50% | < 20% |

### 10.2 Dashboard de Suivi

**Éléments à afficher** :
- Status des derniers runs (unit, IT, contract, E2E)
- Tendance de couverture sur 30 jours
- Contracts en échec (si applicable)
- Budget E2E consommé
- Temps moyen d'exécution

---

## 11. FAQ

### Q: Pourquoi ne pas utiliser un broker mock intelligent ?

**R** : La complexité d'un mock intelligent (avec matching engine, slippage simulation, etc.) est comparable à celle du vrai système. Le risque de bugs dans le mock est élevé. Les contract tests garantissent que nos mocks simples restent synchronisés avec la réalité.

### Q: Les tests E2E ne sont-ils pas trop fragiles ?

**R** : Oui, mais c'est acceptable pour 10% de la suite. Le smoke test quotidien détecte les vrais problèmes d'intégration. Les faux négatifs (API down) sont gérés avec des retries et des alertes appropriées.

### Q: Comment gérer les changements d'API broker ?

**R** : Les contract tests le détectent automatiquement. L'alerte est envoyée dès que le nightly pipeline échoue. L'équipe a alors jusqu'au prochain déploiement pour adapter le code.

### Q: Faut-il des tests de performance ?

**R** : Oui, mais séparément. Les tests de charge ne font pas partie de la pyramide principale. Ils sont exécutés à la demande ou avant les releases majeures.

### Q: Comment tester le WebSocket streaming ?

**R** :
1. **Contract test** : Vérifie que la connexion s'établit et reçoit des messages
2. **IT mock** : Simule le stream avec des messages pré-enregistrés
3. **E2E** : Valide le streaming réel sur Demo

---

## 12. Conclusion

La stratégie "Trading Reality" offre un équilibre pragmatique entre :

- **Sécurité** : Jamais de test sur Live, budget E2E contrôlé
- **Réalisme** : Contract testing garantit la synchronisation avec l'API réelle
- **Rapidité** : 70% des tests (unitaires + IT mock) s'exécutent en < 7 minutes
- **Confiance** : Les 30% restants (contract + E2E) valident l'intégration réelle

Pour un système de trading algorithmique, cette approche minimise le risque de "works on my machine" tout en protégeant le capital.

---

**Date de création** : 2025-12-18
**Auteur** : Claude Code
**Version** : 1.0

