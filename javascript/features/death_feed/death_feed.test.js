// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import DeathFeed from 'features/death_feed/death_feed.js';

describe('DeathFeed', it => {
    it('should track deaths in fifo order', assert => {
        let feature = new DeathFeed();

        for (let i = 1; i <= 10; ++i)
            feature.onPlayerDeath({ playerid: i, killerid: 0, reason: 0 });

        assert.equal(feature.recentDeaths.length, 5);
        assert.deepEqual(feature.recentDeaths, [
            { killee: 10, killer: 0, reason: 0 },
            { killee:  9, killer: 0, reason: 0 },
            { killee:  8, killer: 0, reason: 0 },
            { killee:  7, killer: 0, reason: 0 },
            { killee:  6, killer: 0, reason: 0 }
        ]);

        feature.dispose();
    });
});
