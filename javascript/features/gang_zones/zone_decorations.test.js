// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import { Rect } from 'base/rect.js';
import { Vector } from 'base/vector.js';
import { ZoneDecorations } from 'features/gang_zones/zone_decorations.js';

describe('ZoneDecorations', (it, beforeEach) => {
    let database = null;
    let decorations = null;
    let zone = null;

    beforeEach(() => {
        database = new MockZoneDatabase();
        decorations = new ZoneDecorations(database);
        zone = Object.assign({}, {
            gangId: MockZoneDatabase.BA,
            area: new Rect(2480, 1507, 2565, 1581),
        });
    });

    it('is able to load the stored decorations when a zone is created', async (assert) => {
        assert.isUndefined(decorations.getObjectsForZone(zone));

        const promise = decorations.initializeZone(zone);;

        assert.isDefined(decorations.getObjectsForZone(zone));
        assert.equal([...decorations.getObjectsForZone(zone)].length, 0);

        await promise;

        const existingObjects = [...decorations.getObjectsForZone(zone)].length;

        assert.isAbove(existingObjects, 0);

        zone.area = new Rect(2500, 1507, 2565, 1581);

        await decorations.updateZone(zone);

        assert.isBelow([...decorations.getObjectsForZone(zone)].length, existingObjects);

        await decorations.deleteZone(zone);

        assert.isUndefined(decorations.getObjectsForZone(zone));
    });

    it('is able to deal with creating and deleting of decorations', async (assert) => {
        assert.isUndefined(decorations.getObjectsForZone(zone));

        const modelId = 1225;  // exploding barrel
        const position = new Vector(0, 0, 0);
        const rotation = new Vector(0, 0, 0);

        await decorations.initializeZone(zone);

        assert.isDefined(decorations.getObjectsForZone(zone));

        const existingObjects = [...decorations.getObjectsForZone(zone)].length;

        await decorations.createObject(zone, modelId, position, rotation);

        const objects = [ ...decorations.getObjectsForZone(zone).values() ];
        const decorationIds = [ ...decorations.getObjectsForZone(zone).keys() ];

        assert.equal(objects.length, existingObjects + 1);
        assert.isTrue(objects[existingObjects].isConnected());

        await decorations.removeObject(zone, decorationIds.pop());

        assert.equal([...decorations.getObjectsForZone(zone)].length, existingObjects);
        assert.isFalse(objects[existingObjects].isConnected());
    });
});
