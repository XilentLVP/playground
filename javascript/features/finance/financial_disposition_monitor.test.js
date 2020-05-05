// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialDispositionMonitor,
         kDispositionMonitorSpinDelay } from 'features/finance/financial_disposition_monitor.js';
import { FinancialRegulator } from 'features/finance/financial_regulator.js';

import { MockFinancialNativeCalls } from 'features/finance/test/mock_financial_native_calls.js';

describe('FinancialDispositionMonitor', (it, beforeEach, afterEach) => {
    let gunther = null;
    let russell = null;
    let lucy = null;

    let dispositionMonitor = null;
    let regulator = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        lucy = server.playerManager.getById(/* Lucy= */ 2);

        regulator = new FinancialRegulator(MockFinancialNativeCalls);
        dispositionMonitor = new FinancialDispositionMonitor(regulator, MockFinancialNativeCalls);
    });

    it('corrects differences, regardless of how big the difference is', async (assert) => {
        const monitorPromise = dispositionMonitor.monitor();

        // (1) Have client mismatches of different values for each of the players.
        MockFinancialNativeCalls.setPlayerMoneyForTesting(gunther, -1500);
        MockFinancialNativeCalls.setPlayerMoneyForTesting(russell, 1500);
        MockFinancialNativeCalls.setPlayerMoneyForTesting(lucy, 1);

        await server.clock.advance(kDispositionMonitorSpinDelay);

        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), 0);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(russell), 0);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(lucy), 0);

        dispositionMonitor.dispose();

        await Promise.all([
            server.clock.advance(kDispositionMonitorSpinDelay),
            monitorPromise
        ]);
    });

    it('withdraws money spent in Pay and Spray shops by the player', async (assert) => {

    });

    it('withdraws money spent by tuning a vehicle', async (assert) => {

    });

    it('withdraws or deposits money spent in a casino by the player', async (assert) => {

    });

    it.fails();
});