// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockPlayerDatabase } from 'features/nuwani_commands/test/mock_player_database.js';

describe('PlayerDatabase', it => {
    // Note that while each test instantiates the `MockPlayerDatabase` class, it's actually testing
    // most of the production logic as `MockPlayerDatabase` extends the `PlayerDatabase` changing
    // only the routines that actually interact with the database.

    it('is able to hash and write secure new passwords', async (assert) => {
        const noSaltInstance = new MockPlayerDatabase(/* passwordSalt= */ null);
        try {
            await noSaltInstance.changePassword('foo', 'bar');
            assert.notReached();

        } catch {}

        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');
        const result = await instance.changePassword('[BB]Ricky92', 'ch4ng3m3');

        assert.isTrue(result);

        assert.equal(instance.changePassQueries.length, 1);
        assert.equal(instance.changePassQueries[0].nickname, '[BB]Ricky92');
        assert.equal(instance.changePassQueries[0].password.length, 40);
        assert.isAboveOrEqual(instance.changePassQueries[0].databaseSalt, 100000000);
        assert.isBelowOrEqual(instance.changePassQueries[0].databaseSalt, 999999999);
    });

    it('is able to generate random database password salts', assert => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        for (let i = 0; i < 500; ++i) {
            const salt = instance.generateDatabaseSalt();

            assert.isAboveOrEqual(salt, 100000000);
            assert.isBelowOrEqual(salt, 999999999);
        }
    });

    it('is able to validate numeric values when updating player data', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        try {
            await instance.updatePlayerField('nickname', 'kill_count', -9999999999);
            assert.notReached();

        } catch {}

        try {
            await instance.updatePlayerField('nickname', 'kill_count', 9999999999);
            assert.notReached();

        } catch {}

        const result = await instance.updatePlayerField('nickname', 'kill_count', '28347');
        assert.isTrue(typeof result === 'number');
        assert.strictEqual(result, 28347);
    });

    it('is able to validate string values when updating player data', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        try {
            await instance.updatePlayerField('nickname', 'death_message', 'a'.repeat(500));
            assert.notReached();

        } catch {}

        const result = await instance.updatePlayerField('nickname', 'death_message', 'Kaboom!');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, 'Kaboom!');
    });

    it('should be able to format and update colours', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        const value = await instance.getPlayerField('[BB]Ricky92', 'custom_color');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, '0x8952EB');

        const invalidValues = ['red', '0xFF', '0xFFFF', 'FFFFFF', '0xFFFFFFFF', 15653933];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'custom_color', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.isTrue(exception.message.includes('not a valid color'));
            }
        }

        const result = await instance.updatePlayerField('nickname', 'custom_color', '0xFF00FF');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, '0xFF00FF');

        assert.isTrue(typeof instance.updatedValue === 'number');
        assert.equal(instance.updatedValue, 16711935);
    });

    it('should be able to format and update player levels', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        const value = await instance.getPlayerField('[BB]Ricky92', 'level');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, 'Management');

        const invalidValues = ['admin', 'mod', 'Moderator', 'management'];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'level', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.isTrue(exception.message.includes('not a valid player level'));
            }
        }

        const result = await instance.updatePlayerField('nickname', 'level', 'Player');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, 'Player');

        assert.isTrue(typeof instance.updatedValue === 'string');
        assert.equal(instance.updatedValue, 'Player');
    });

    it('should be able to format and update bank account types', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        const value = await instance.getPlayerField('[BB]Ricky92', 'money_bank_type');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, 'Premier');

        const invalidValues = ['normal', 'SuperAccount', 'premier'];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'money_bank_type', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.isTrue(exception.message.includes('not a valid bank account type'));
            }
        }

        const result = await instance.updatePlayerField('nickname', 'money_bank_type', 'Normal');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, 'Normal');

        assert.isTrue(typeof instance.updatedValue === 'string');
        assert.equal(instance.updatedValue, 'Normal');
    });

    it('should be able to format and update last seen IP addresses', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        const value = await instance.getPlayerField('[BB]Ricky92', 'last_ip');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, '37.48.87.211');

        const result = await instance.updatePlayerField('[BB]Ricky92', 'last_ip', '127.0.0.1');
        assert.isTrue(typeof result === 'string');
        assert.equal(result, '127.0.0.1');

        assert.isTrue(typeof instance.updatedValue === 'number');
        assert.equal(instance.updatedValue, 2130706433);
    });

    it('should be able to format and update last seen times', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        const value = await instance.getPlayerField('[BB]Ricky92', 'last_seen');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, '2019-12-24 12:44:41');

        const invalidValues = ['bakery', 'yesterday', '???'];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'last_seen', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.isTrue(exception.message.includes('not a valid date format'));
            }
        }

        const outOfRangeValues = ['2041-12-01 12:41:00', '2001-01-01 05:24:12'];
        for (const outOfRangeValue of outOfRangeValues) {
            try {
                await instance.updatePlayerField('nickname', 'last_seen', outOfRangeValue);
                assert.notReached();
    
            } catch (exception) {
                assert.isTrue(exception.message.includes('between 2006 and right now'));
            }
        }

        const result = await instance.updatePlayerField(
            '[BB]Ricky92', 'last_seen', '2020-04-26 20:27:12');

        assert.isTrue(typeof result === 'string');
        assert.equal(result, '2020-04-26 20:27:12');

        assert.isTrue(typeof instance.updatedValue === 'string');
        assert.equal(instance.updatedValue, '2020-04-26 20:27:12');
    });

    it('should allow for adding aliases to a user account', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        try {
            await instance.addAlias('[BB]Ricky92', '^^Rickster^^');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('not a valid SA-MP nickname'));
        }

        try {
            await instance.addAlias('FakeUser', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('could not be found'));
        }

        try {
            await instance.addAlias('WoodPecker', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('is an alias by itself'));
        }

        try {
            await instance.addAlias('[BB]Ricky92', '[BA]Ro[BB]in');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('already is a player'));
        }

        assert.isTrue(await instance.addAlias('[BB]Ricky92', 'AliasName'));

        assert.isNotNull(instance.aliasMutation);
        assert.equal(instance.aliasMutation.userId, 4050);
        assert.equal(instance.aliasMutation.alias, 'AliasName');
    });

    it('should allow for removing aliases from a user account', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        try {
            await instance.removeAlias('FakeUser', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('could not be found'));
        }

        try {
            await instance.removeAlias('WoodPecker', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('is an alias by itself'));
        }

        try {
            await instance.removeAlias('[BB]Ricky92', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('is not an alias'));
        }

        assert.isTrue(await instance.removeAlias('[BB]Ricky92', 'WoodPecker'));

        assert.isNotNull(instance.aliasMutation);
        assert.equal(instance.aliasMutation.userId, 4050);
        assert.equal(instance.aliasMutation.alias, 'WoodPecker');
    });

    it('should be able to safely change the nickname of a user', async (assert) => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        try {
            await instance.changeName('[BB]Ricky92', '^^Rickster^^');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('not a valid SA-MP nickname'));
        }

        try {
            await instance.changeName('FakeUser', 'NewNick');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('could not be found'));
        }

        try {
            await instance.changeName('WoodPecker', 'NewNick');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('is an alias'));
        }

        try {
            await instance.changeName('[BB]Ricky92', '[BA]Ro[BB]in');
            assert.notReached();
        } catch (exception) {
            assert.isTrue(exception.message.includes('already is a player'));
        }

        assert.isTrue(await instance.changeName('[BB]Ricky92', 'NewNick'));

        assert.isNotNull(instance.nameMutation);
        assert.equal(instance.nameMutation.userId, 4050);
        assert.equal(instance.nameMutation.nickname, '[BB]Ricky92');
        assert.equal(instance.nameMutation.newNickname, 'NewNick');
    });
});
