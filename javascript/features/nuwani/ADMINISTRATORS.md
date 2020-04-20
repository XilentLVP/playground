# Administrator IRC Guide
This guide exists for administrators of Las Venturas Playground who wish to become more versed in
the available IRC commands. Our tools are powerful and have evolved over the years, which means
that not everybody may be fully up-to-speed on the latest.

## Controlling who can access the server
As an administrator, you have the ability to control which players are able to access the server,
and to revoke access from any player for any reason. We call this _banning_ and _unbanning_ players.

Las Venturas Playground supports three kinds of bans:

  * **IP addresses**, the default, revoking access to a particular person.
  * **IP ranges**, available through IRC commands, revoking access to a region.
  * **GPCI bans**, which are player's serial numbers, much harder to change.

All types of bans have mandatory associations with a player, and must have an expiration date set.
Bans will also be associated with the person who issued the ban, and come attached with a reason. In
addition to that, we also log each time a ban gets lifted.

### 🤔 I want to ban an in-game player
**Command**: `!ban [player] [days=3] [reason]`

#### Examples
```
!ban 16 Unexpected use of a minigun
!ban Gunther Not allowing me to walk on the ship
!ban Gunther 30 Being a douce, come back in 30 days!
```

#### Notes
  * By default, bans will last for three days.

### 🤔 I want to ban a player by IP address
**Command**: `!ban ip [ip] [playerName] [days] [reason]`

#### Examples
```
!ban ip 127.0.0.1 3 Don't want those pesky NPCs
!ban ip 192.168.0.1 30 Banning my router for 30 days for crappy firmware
```

### 🤔 I want to ban a player by IP range
**Command**: `!ban range [ip range] [playerName] [days] [reason]`

#### Examples
```
!ban range 192.168.*.* Family 7 Taking a week off from my household members
!ban range 56.*.*.* USPS 3 My mail was delayed, focus on that please
```

#### Notes
  * Administrators are allowed to ban up to 65,536 addresses. Management members are allowed to
    ban up to 16,777,216 addresses. Raw database access is required in order to go beyond that.

### 🤔 I want to ban a player by serial number
**Command**: `!ban serial [gpci] [playerName] [days] [reason]`

#### Examples
```
!ban serial 5111943668 [HC]Robot 10 Not sure if you're real?
!ban serial 7483910346 spambot0 30 Trying to hammer the server
```

### 🤔 I want to find out who is using an IP address
**Command**: `!ipinfo [ip | ip range]`

#### Examples
```
!ipinfo 56.0.105.103
!ipinfo 192.168.*.*
```

#### Notes
  * The 15 most recent nicknames will be displayed. Raw database access is required in order to
    access additional nicknames.

### 🤔 I want to find out which IP addresses a player is using
**Command**: `!ipinfo [nickname]`

#### Examples
```
!ipinfo USPS
```

#### Notes
  * The 15 most recent IP addresses will be displayed. Raw database access is required in order to
    access additional IP addresses.

### 🤔 I want to find out who is using a serial number
**Command**: `!serialinfo [serial]`

#### Examples
```
!serialinfo 5111943668
```

#### Notes
  * The 15 most recent nicknames will be displayed. Raw database access is required in order to
    access additional nicknames.

### 🤔 I want to find out which serial(s) a player is using
**Command**: `!serialinfo [nickname]`

#### Examples
```
!serialinfo USPS
```

#### Notes
  * The 15 most recent serial numbers will be displayed. Raw database access is required in order to
    access additional serial numbers.

### 🤔 I want to find out what a player's record is
**Command**: `!why [nickname]`

#### Examples
```
!why USPS
```

#### Notes
  * The 5 most recent entries on the player's record will be displayed. Additional information is
    available through the website, which the command will give you a link for.

### 🤔 I want to add a note to a player's record
**Command**: `!addnote [nickname] [note]`

#### Examples
```
!addnote USPS Did not receive my mail again, grrrr!
```

### 🤔 I want to unban a player by IP address, range or serial number
**Command**: `!unban [ip | ip range | serial] [note]`

#### Examples
```
!unban 56.0.105.103 Turns out that banning USPS does not make parcels appear
!unban 192.168.*.* My flat mate bribed me in giving them access again
!unban 7483910346 Turns out it was Joe pulling another prank
```