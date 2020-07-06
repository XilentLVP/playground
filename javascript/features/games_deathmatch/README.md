# Games Deathmatch API
This feature contains extended functionality on top of the [Games API](../games/) that makes it
easier to build deathmatch games for Las Venturas Playground, by providing well considered options
that apply to most sort of contests.

## How to use the Games Deathmatch API?
Where you would normally register a game with the `Games.registerGame()` function, you will be using
the `GamesDeathmatch.registerGame()` function instead. Pass in a class that extends
[DeathmatchGame](deathmatch_game.js), and you'll be able to use all of the extra functionality and
[options][1] provided by this feature.

Your feature must depend on the `games_deathmatch` instead of the `games` feature.

## Options when registering a game
The following options will be made available in addition to the [default ones][1].

Option              | Description
--------------------|--------------
`lagCompensation`   | Whether lag compensation should be enabled. Defaults to `true`.
`mapMarkers`        | Whether map markers should be enabled for participants. One of `Enabled` (default), `Team only` or `Disabled`.
`objective`         | Objective of the game. See the separate section on this value.
`teamDamage`        | Whether players in the same team can issue damage to each other. Defaults to `true`.

## Settings when starting a game
The following settings will be made available to all deathmatch games, and can be customized by
players as they see fit. Specialized interfaces will be offered where appropriate.

Setting             | Description
--------------------|--------------
`Lag compensation`  | Whether lag compensation should be enabled.
`Map markers`       | Whether map markers should be enabled for participants.
`Objective`         | What the objective of the game is, which defines the winning conditions.
`Team damage`       | Whether players in the same team can issue damage to each other.

## Advanced option: `objective`
The objective of a game defines its winning conditions. We support a variety of different options,
which are configurable by the player and can also be set in game configuration. These options are
objects, because certain specialization is needed.

Objective          | Description                                | Example
-------------------|--------------------------------------------|---------------------
Last man standing  | Last player to die wins.                   | `{ type: 'Last man standing' }`
Best of...         | Best of _X_ rounds. Respawn after a kill.  | `{ type: 'Best of...', kills: 5 }`
First to...        | First to get _X_ kills.                    | `{ type: 'First to...', kills: 3 }`
Time limit...      | Most kills within the time limit.          | `{ type: 'Time limit...', seconds: 180 }`
Continuous         | No winners, players will have to `/leave`  | `{ type: 'Continuous' }`

The default objective is configurable through `/lvp settings` in the `Games` category. The values
there must match one of the aforementioned values.

[1]: ../games#options-when-registering-a-game