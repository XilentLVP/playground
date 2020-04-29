// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';
import { MockBanDatabase } from 'features/punishments/test/mock_ban_database.js';

describe('PlayerDatabase', it => {
    // Note that while each test instantiates the `MockBanDatabase` class, it's actually testing
    // most of the production logic as `MockBanDatabase` extends the `BanDatabase` changing only the
    // routines that actually interact with the database.

    it('is able to add notes the the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeNote,
            sourceNickname: '[BB]Ricky92',
            subjectNickname: '[HC]Golk3r',
            note: 'Good chap!'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeNote);
        assert.equal(instance.addedEntry.banIpRangeStart, 0);
        assert.equal(instance.addedEntry.banIpRangeEnd, 0);
        assert.equal(instance.addedEntry.banSerial, 0);
        assert.equal(instance.addedEntry.banDurationDays, 0);
        assert.equal(instance.addedEntry.sourceUserId, 0);
        assert.equal(instance.addedEntry.sourceNickname, '[BB]Ricky92');
        assert.equal(instance.addedEntry.subjectUserId, 0);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'Good chap!');

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeNote,
            sourceUserId: 4050,
            sourceNickname: 'Beaner',
            subjectUserId: 1337,
            subjectNickname: '[HC]Golk3r',
            note: 'Seems to be fighting a lot?'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.sourceUserId, 4050);
        assert.equal(instance.addedEntry.sourceNickname, 'Beaner');
        assert.equal(instance.addedEntry.subjectUserId, 1337);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'Seems to be fighting a lot?');
    });

    it('is able to add notes about kicks to the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeKick,
            sourceNickname: '[BB]Ricky92',
            subjectUserId: 4050,
            subjectNickname: 'Sinned',
            note: 'Seems to be sinning all around...'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeKick);
    });

    it('is able to add in-game bans to the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeBan,
            banDurationDays: 5,
            banIpAddress: '127.0.0.1',
            sourceNickname: 'Currode',
            subjectNickname: '[HC]Golk3r',
            note: 'Health cheating'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeBan);
        assert.equal(instance.addedEntry.banIpRangeStart, 2130706433);
        assert.equal(instance.addedEntry.banIpRangeEnd, 2130706433);
        assert.equal(instance.addedEntry.banSerial, 0);
        assert.equal(instance.addedEntry.banDurationDays, 5);
        assert.equal(instance.addedEntry.sourceUserId, 0);
        assert.equal(instance.addedEntry.sourceNickname, 'Currode');
        assert.equal(instance.addedEntry.subjectUserId, 0);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'Health cheating');
    });

    it('is able to add IP bans to the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeBanIp,
            banDurationDays: 10,
            banIpAddress: '37.48.87.211',
            sourceNickname: 'Currode',
            subjectNickname: '[HC]Golk3r',
            note: 'Do not come back until Thursday'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeBanIp);
        assert.equal(instance.addedEntry.banIpRangeStart, 623925203);
        assert.equal(instance.addedEntry.banIpRangeEnd, 623925203);
        assert.equal(instance.addedEntry.banSerial, 0);
        assert.equal(instance.addedEntry.banDurationDays, 10);
        assert.equal(instance.addedEntry.sourceUserId, 0);
        assert.equal(instance.addedEntry.sourceNickname, 'Currode');
        assert.equal(instance.addedEntry.subjectUserId, 0);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'Do not come back until Thursday');
    });

    it('is able to add IP range bans to the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeBanIp,
            banDurationDays: 15,
            banIpRange: '37.48.*.*',
            sourceNickname: 'Currode',
            subjectNickname: '[HC]Golk3r',
            note: 'I will ban your entire city!'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeBanIp);
        assert.equal(instance.addedEntry.banIpRangeStart, 623902720);
        assert.equal(instance.addedEntry.banIpRangeEnd, 623968255);
        assert.equal(instance.addedEntry.banSerial, 0);
        assert.equal(instance.addedEntry.banDurationDays, 15);
        assert.equal(instance.addedEntry.sourceUserId, 0);
        assert.equal(instance.addedEntry.sourceNickname, 'Currode');
        assert.equal(instance.addedEntry.subjectUserId, 0);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'I will ban your entire city!');
    });

    it('is able to add serial bans to the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeBan,
            banDurationDays: 20,
            banSerialNumber: 631201714,
            sourceNickname: 'Currode',
            subjectUserId: 42,
            subjectNickname: '[HC]Golk3r',
            note: 'IP bans do not seem to work'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeBan);
        assert.equal(instance.addedEntry.banIpRangeStart, 0);
        assert.equal(instance.addedEntry.banIpRangeEnd, 0);
        assert.equal(instance.addedEntry.banSerial, 631201714);
        assert.equal(instance.addedEntry.banDurationDays, 20);
        assert.equal(instance.addedEntry.sourceUserId, 0);
        assert.equal(instance.addedEntry.sourceNickname, 'Currode');
        assert.equal(instance.addedEntry.subjectUserId, 42);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'IP bans do not seem to work');
    });
});
