// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Contains the /dm command for players to allow to teleport to a DM zone with specific weapons.
export class DeathMatchCommands {    

    constructor(manager) {
        server.commandManager.buildCommand('deathmatch')
            .parameters([{ name: 'zone', type: CommandBuilder.NUMBER_PARAMETER }])
            .sub('leave')
                .build(DeathMatchCommands.prototype.onLeaveCommand.bind(this))
            .sub('stats')
                .build(DeathMatchCommands.prototype.onStatsCommand.bind(this))
    
        .build(DeathMatchCommands.prototype.onDmCommand.bind(this));

        this.manager_ = manager;
    }

    // The death match command is being used.
    onDmCommand(player, zone) { 
        if(zone === null || zone === undefined || typeof zone !== 'number') {
            player.sendMessage(Message.DEATH_MATCH_INVALID_ZONE, zone);
        }

        this.manager_.goToDmZone(player, zone);
    }

    onLeaveCommand(player) {
        this.manager_.leave(player);
    }

    onStatsCommand(player) { 
        this.manager_.showStats(player);
    }

    // Cleans up the state created by this class, i.e. removes the command.
    dispose() {
        server.commandManager.removeCommand('deathmatch');
    }
}