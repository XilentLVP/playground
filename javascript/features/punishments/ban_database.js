// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ip2long, long2ip, isIpAddress, isIpRange, rangeToText } from 'features/nuwani_commands/ip_utilities.js';

// MySQL query for getting the most recent log entries of a player.
const GET_LOG_ENTRIES_QUERY = `
    SELECT
        log_id,
        log_date,
        log_type,
        ban_ip_range_start,
        ban_ip_range_end,
        gpci_hash,
        ban_expiration_date,
        user_nickname,
        subject_nickname,
        description
    FROM
        logs
    WHERE
        subject_nickname = ? AND
        DATE_SUB(NOW(), INTERVAL ? DAY) < log_date
    ORDER BY
        log_date DESC
    LIMIT
        ?`;

const GET_LOG_ENTRIES_COUNT_QUERY = `
    SELECT
        COUNT(*) AS total
    FROM
        logs
    WHERE
        subject_nickname = ?`;

// MySQL query to execute when adding an entry to the database.
const ADD_ENTRY_QUERY = `
    INSERT INTO
        logs
        (log_date, log_type, ban_ip_range_start, ban_ip_range_end, gpci_hash,
         ban_expiration_date,
         user_nickname, user_id, subject_nickname,
         subject_user_id,
         description)
    VALUES
        (NOW(), ?, ?, ?, ?,
         IF(? = 0, '1970-01-01 01:00:00', DATE_ADD(NOW(), INTERVAL ? DAY)),
         ?, ?, ?,
         IF(? = 0, IFNULL((
            SELECT
                user_id
            FROM
                users_nickname
            WHERE
                nickname = ?), 0), ?),
         ?)`;

// MySQL query to identify active bans for the given parameters.
const FIND_ACTIVE_BANS_QUERY = `
    SELECT
        log_id,
        log_date,
        log_type,
        ban_ip_range_start,
        ban_ip_range_end,
        gpci_hash,
        ban_expiration_date,
        user_nickname,
        subject_nickname,
        description
    FROM
        logs
    WHERE
        ban_expiration_date > NOW() AND
        (
            IF(? = 0, FALSE, ban_ip_range_start >= ? AND ban_ip_range_end <= ?) OR
            IF(? = 0, FALSE, gpci_hash = ?) OR
            IF(? = '', FALSE, subject_nickname = ?)
        )
    ORDER BY
        log_date DESC
    LIMIT
        5`;

// MySQL query to find the nicknames that have (recently) been used by IP address, range or serial
const RECENT_NICKNAMES_QUERY = `
    SELECT
        nickname,
        COUNT(session_id) AS total
    FROM
        sessions
    WHERE
        ((ip_address >= ? AND ip_address <= ?) OR
         (gpci_hash = ?)) AND
        DATEDIFF(NOW(), session_date) < ?
    GROUP BY
        nickname
    ORDER BY
        session_date DESC
    LIMIT
        10`;

const RECENT_NICKNAMES_COUNT_QUERY = `
    SELECT
        COUNT(DISTINCT nickname) AS total
    FROM
        sessions
    WHERE
        ((ip_address >= ? AND ip_address <= ?) OR
         (gpci_hash = ?)) AND
        DATEDIFF(NOW(), session_date) < ?`;

// MySQL queries to find the IP addresses that have (recently) been used by a particular nickname.
const RECENT_IP_QUERY = `
    SELECT
        ip_address,
        COUNT(session_id) AS total
    FROM
        sessions
    WHERE
        nickname = ? AND
        DATEDIFF(NOW(), session_date) < ?
    GROUP BY
        ip_address
    ORDER BY
        session_date DESC
    LIMIT
        10`;

const RECENT_IP_COUNT_QUERY = `
    SELECT
        COUNT(DISTINCT ip_address) AS total
    FROM
        sessions
    WHERE
        nickname = ? AND
        DATEDIFF(NOW(), session_date) < ?`;

// MySQL queries to find the serial numbers that have (recently) been used by a particular nickname.
const RECENT_SERIAL_QUERY = `
    SELECT
        sessions.gpci_hash,
        IFNULL(sessions_common_gpci.hits, 0) AS hits,
        COUNT(sessions.session_id) AS total
    FROM
        sessions
    LEFT JOIN
        sessions_common_gpci ON sessions_common_gpci.gpci_hash = sessions.gpci_hash
    WHERE
        sessions.nickname = ? AND
        DATEDIFF(NOW(), sessions.session_date) < ?
    GROUP BY
        sessions.gpci_hash
    ORDER BY
        sessions.session_date DESC
    LIMIT
        10`;

const FREQUENT_SERIAL_QUERY = `
    SELECT
        sessions_common_gpci.hits
    FROM
        sessions_common_gpci
    WHERE
        gpci_hash = ?`

const RECENT_SERIAL_COUNT_QUERY = `
    SELECT
        COUNT(DISTINCT gpci_hash) AS total
    FROM
        sessions
    WHERE
        nickname = ? AND
        DATEDIFF(NOW(), session_date) < ?`;

// MySQL query for getting a certain number of most recent bans.
const LAST_BANS_QUERY = `
    SELECT
        log_id,
        log_date,
        log_type,
        ban_ip_range_start,
        ban_ip_range_end,
        gpci_hash,
        ban_expiration_date,
        user_nickname,
        subject_nickname,
        description
    FROM
        logs
    WHERE
        ban_expiration_date > NOW()
    ORDER BY
        log_date DESC
    LIMIT
        ?`;

const UNBAN_QUERY = `
    UPDATE
        logs
    SET
        ban_expiration_date = NOW()
    WHERE
        log_id = ?`
    
// MySQL query to get all the ranges which have one or more exceptions.
const RANGE_EXCEPTION_LIST_ALL_QUERY = `
    SELECT
        ip_range_begin,
        ip_range_end,
        COUNT(*) AS exception_count
    FROM
        range_exceptions
    GROUP BY
        ip_range_begin, ip_range_end
    ORDER BY
        exception_count DESC`;

// MySQL query to get the range exceptions for the given |range|.
const RANGE_EXCEPTION_LIST_QUERY = `
    SELECT
        exception_id,
        exception_date,
        exception_author,
        exception_tally,
        nickname
    FROM
        range_exceptions
    WHERE
        ip_range_begin >= ? AND
        ip_range_end <= ?
    ORDER BY
        exception_tally DESC, nickname ASC`;

// MySQL query to add an exception for the |range|.
const RANGE_EXCEPTION_ADD_QUERY = `
    INSERT INTO
        range_exceptions
        (exception_date, exception_author, ip_range_begin, ip_range_end, nickname)
    VALUES
        (NOW(), ?, ?, ?, ?)`;

// MySQL query to remove an exception for the |range|.
const RANGE_EXCEPTION_DELETE_QUERY = `
    DELETE FROM
        range_exceptions
    WHERE
        exception_id = ?
    LIMIT
        1`;

// Responsible for actually executing ban-related operations on the MySQL database.
export class BanDatabase {
    // Corresponds to the `log_type` column in the database.
    static kTypeBan = 'ban';
    static kTypeBanIp = 'banip';
    static kTypeKick = 'kick';
    static kTypeNote = 'note';
    static kTypeUnban = 'unban';

    // Boundaries on the number of days a ban may last.
    static kMinimumDuration = 1;
    static kMaximumDuration = 999;

    // Limits on the maximum number of affected IPs for range bans based on level.
    static kMaximumIpRangeCountAdministrator = 256 * 256;     // 0.0.*.*
    static kMaximumIpRangeCountManagement = 256 * 256 * 256;  // 0.*.*.*
    
    // Gets the |limit| most recent log entries stored for the given |nickname|.
    async getLogEntries({ nickname, maxAge = 365, limit = 5 } = {}) {
        const { total, results } = await this._getLogEntriesQuery({ nickname, maxAge, limit });
        const logs = [];

        for (const row of results)
            logs.push(this.toBanInformation(row));

        return { total, logs };
    }

    // Actually runs the query for getting the |limit| most recent log entries from |nickname|.
    async _getLogEntriesQuery({ nickname, maxAge, limit }) {
        const [ totalResult, entriesResult ] = await Promise.all([
            server.database.query(GET_LOG_ENTRIES_COUNT_QUERY, nickname),
            server.database.query(GET_LOG_ENTRIES_QUERY, nickname, maxAge, limit)
        ]);

        const total = totalResult && totalResult.rows.length ? totalResult.rows[0].total : 0;
        const results = entriesResult ? entriesResult.rows : [];

        return { total, results };
    }

    // Adds an entry to the user log table. The |type|, |sourceNickname|, |subjectNickname| and
    // |note| fields are required. When known, the |sourceUserId| and |subjectUserId| fields are
    // accepted for all types as well. Type specific fields are as follows:
    //
    // ** kTypeNote
    //    No additional parameters have to be given.
    //
    // ** kTypeBan and kTypeBanIp
    //    banDurationDays: number of days for which the bans should apply.
    //
    //    ...and one of the following:
    //        banIpAddress: a textual IP address (127.0.0.1) that should be banned.
    //        banIpRange: a textual IP range (127.0.*.*) that should be banned.
    //        banSerialNumber: a numeric serial number that should be banned.
    //
    // Returns whether the log entry that has been written to the database, as a boolean.
    async addEntry({ type, banDurationDays = null, banIpAddress = null, banIpRange = null,
                     banSerialNumber = null, sourceUserId = null, sourceNickname,
                     subjectUserId = null, subjectNickname, note } = {}) {
        switch (type) {
            case BanDatabase.kTypeBan:
            case BanDatabase.kTypeBanIp:
                if (!banDurationDays || banDurationDays < 0)
                    throw new Error('A duration for the ban, in days, must be given.');

                let banIpRangeStart = 0;
                let banIpRangeEnd = 0;
                let banSerial = 0;

                if (banIpAddress !== null) {
                    if (banIpRange !== null || banSerialNumber !== null)
                        throw new Error('Exactly one type of ban must be used at a time.');
                    
                    banIpRangeStart = ip2long(banIpAddress);
                    banIpRangeEnd = ip2long(banIpAddress);

                } else if (banIpRange !== null) {
                    if (banSerialNumber !== null)
                        throw new Error('Exactly one type of ban must be used at a time.');
                    
                    banIpRangeStart = ip2long(banIpRange.replace(/\*/g, '0'));
                    banIpRangeEnd = ip2long(banIpRange.replace(/\*/g, '255'));

                } else if (banSerialNumber) {
                    banSerial = banSerialNumber;

                } else {
                    throw new Error('Exactly one type of ban must be used at a time.');
                }

                return this.addEntryInternal({
                    type,
                    banIpRangeStart,
                    banIpRangeEnd,
                    banSerial,
                    banDurationDays,
                    sourceUserId: sourceUserId ?? 0,
                    sourceNickname,
                    subjectUserId: subjectUserId ?? 0,
                    subjectNickname,
                    note
                });
        
            case BanDatabase.kTypeKick:
            case BanDatabase.kTypeNote:
            case BanDatabase.kTypeUnban:
                return this.addEntryInternal({
                    type,
                    banIpRangeStart: 0,
                    banIpRangeEnd: 0,
                    banSerial: 0,
                    banDurationDays: 0,
                    sourceUserId: sourceUserId ?? 0,
                    sourceNickname,
                    subjectUserId: subjectUserId ?? 0,
                    subjectNickname,
                    note
                });
            
            default:
                throw new Error(`Support for the given ${type} has not been implemented yet.`);
        }
    }

    // Internal, low-level routine for adding a log entry to the database. All fields are required
    // for this call, in order to be explicit about _what_ is being added to the logs.
    //
    // In order to validate consistency of the data, this method does low-level validation to ensure
    // that mutually exclude fields are not both set, and bans are not written for non-ban types.
    async addEntryInternal({ type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays,
                             sourceUserId, sourceNickname, subjectUserId, subjectNickname, note }) {
        if (![BanDatabase.kTypeBan, BanDatabase.kTypeBanIp].includes(type)) {
            if (banIpRangeStart !== 0 || banIpRangeEnd !== 0)
                throw new Error('Cannot add IP bans for types other than "ban" and "banip".');
            
            if (banSerial !== 0)
                throw new Error('Cannot add serial bans for types other than "ban" and "banip".');
            
            if (banDurationDays !== 0)
                throw new Error('Cannot set a ban expiration date on non-ban types.');

        } else {
            if (banIpRangeEnd < banIpRangeStart)
                throw new Error('Cannot ban IP ranges that end before they start.');
        }

        if (!sourceNickname.length)
            throw new Error('The nickname who is responsible for this log item must be known.');
        
        if (!subjectNickname.length)
            throw new Error('The nickname whom this log item is for must be known.');
        
        if (!note.length)
            throw new Error('The note to add to the log item must be known.');

        if (note.length > 128)
            throw new Error('The length of a note cannot exceed 128 characters.');

        return this._addEntryQuery(
            { type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays, sourceUserId,
              sourceNickname, subjectUserId, subjectNickname, note });
    }

    // Actually executes a MySQL query for adding a log item to the database. All fields must have
    // been validated by this point. Returns whether the entry could be written to the database.
    async _addEntryQuery({ type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays,
                           sourceUserId, sourceNickname, subjectUserId, subjectNickname, note }) {
        const result = await server.database.query(
            ADD_ENTRY_QUERY, type, banIpRangeStart, banIpRangeEnd, banSerial, banDurationDays,
            banDurationDays, sourceNickname, sourceUserId, subjectNickname, subjectUserId,
            subjectNickname, subjectUserId, note);

        return result && result.insertId !== 0;
    }

    // Derives what sort of indicator the |value| describes, which could be an IP address, range,
    // serial number or a nickname. Returns NULL when we're not sure.
    deriveBanConditional(value) {
        const numericValue = parseInt(value, 10);

        if (!Number.isNaN(numericValue) && Number.isInteger(numericValue) &&
                numericValue.toString().length === value.length) {
            return { nickname: null, ip: null, range: null, serial: numericValue };
        }

        if (isIpAddress(value))
            return { nickname: null, ip: value, range: null, serial: null };
        
        if (isIpRange(value))
            return { nickname: null, ip: null, range: value, serial: null };
        
        if (/^[0-9a-z\[\]\(\)\$@\._=]{1,24}$/i.test(value))
            return { nickname: value, ip: null, range: null, serial: null };
        
        return null;
    }

    // Gets the |limit| most recent, still active bans from the database, together with context on
    // the ban itself, such as the issuer, subject and what type of ban it is.
    async getRecentBans(limit = 10) {
        const result = await this._getRecentBansQuery(limit);
        const bans = [];

        for (const row of result)
            bans.push(this.toBanInformation(row));

        return bans;
    }

    // Actually fetches the |limit| most recent bans from the database, and returns the raw rows.
    async _getRecentBansQuery(limit) {
        const result = await server.database.query(LAST_BANS_QUERY, limit);
        return result ? result.rows : [];
    }

    // Finds the nicknames that have been (recently) been used by the given |ip|, which could either
    // be an individual IP address, or an IP range of unlimited size.
    async findNicknamesForIpAddressOrRange({ ip, ...options } = {}) {
        let ipRangeBegin = 0;
        let ipRangeEnd = 0;

        if (isIpAddress(ip)) {
            ipRangeBegin = ip2long(ip);
            ipRangeEnd = ipRangeBegin;
        } else if (isIpRange(ip)) {
            ipRangeBegin = ip2long(ip.replace(/\*/g, '0'));
            ipRangeEnd = ip2long(ip.replace(/\*/g, '255'));
        } else {
            return null;
        }

        return this._findNicknamesQuery({ ipRangeBegin, ipRangeEnd, ...options });
    }

    // Finds the nicknames that have (recently) been used by the given |serial|.
    async findNicknamesForSerial({ serial, ...options } = {}) {
        const [ results, serialHits ] = await Promise.all([
            this._findNicknamesQuery({ serial, ...options }),
            this._isCommonSerialQuery(serial),
        ]);

        results.commonSerial = serialHits > 250;
        return results;
    }

    // Actually runs the queries necessary to determine the active nicknames for either an IP
    // range, or for a serial number.
    async _findNicknamesQuery({ ipRangeBegin = 0, ipRangeEnd = 0, serial = 0, maxAge = 1095 } = {}) {
        const [ totalResults, topResults ] = await Promise.all([
            server.database.query(
                RECENT_NICKNAMES_COUNT_QUERY, ipRangeBegin, ipRangeEnd, serial, maxAge),
            server.database.query(RECENT_NICKNAMES_QUERY, ipRangeBegin, ipRangeEnd, serial, maxAge),
        ]);

        const results = {
            total: 0,
            entries: [],
            commonSerial: false,
        };

        if (totalResults && totalResults.rows.length === 1)
            results.total = totalResults.rows[0].total;
        
        if (topResults && topResults.rows.length) {
            for (const row of topResults.rows)
                results.entries.push({ text: row.nickname, sessions: row.total });
        }

        return results;
    }

    // Returns a boolean indicating whether the given |serial| is considered common or not.
    async _isCommonSerialQuery(serial) {
        const result = await server.database.query(FREQUENT_SERIAL_QUERY, serial);
        return result && result.rows.length ? result.rows[0].hits : 0;
    }

    // Finds the IP addresses that have (recently) been used by the given |nickname|.
    async findIpAddressesForNickname({ nickname, maxAge = 1095 } = {}) {
        const [ totalResults, topResults ] = await Promise.all([
            server.database.query(RECENT_IP_COUNT_QUERY, nickname, maxAge),
            server.database.query(RECENT_IP_QUERY, nickname, maxAge),
        ]);

        const results = {
            total: 0,
            entries: []  
        };

        if (totalResults && totalResults.rows.length === 1)
            results.total = totalResults.rows[0].total;
        
        if (topResults && topResults.rows.length) {
            for (const row of topResults.rows)
                results.entries.push({ text: long2ip(row.ip_address), sessions: row.total });
        }

        return results;
    }

    // Finds the serial numbers that have (recently) been used by the given |nickname|.
    async findSerialsForNickname({ nickname, maxAge = 1095 } = {}) {
        const [ totalResults, topResults ] = await Promise.all([
            server.database.query(RECENT_SERIAL_COUNT_QUERY, nickname, maxAge),
            server.database.query(RECENT_SERIAL_QUERY, nickname, maxAge),
        ]);

        const results = {
            total: 0,
            entries: []  
        };

        if (totalResults && totalResults.rows.length === 1)
            results.total = totalResults.rows[0].total;
        
        if (topResults && topResults.rows.length) {
            for (const row of topResults.rows) {
                results.entries.push({
                    text: row.gpci_hash,
                    common: row.hits > 250,
                    sessions: row.total
                });
            }
        }

        return results;
    }

    // Finds the active ban(s) that match the given parameters, either by |nickname|, |ip|, |range|
    // or |serial|, or a combination thereof. Returns detailed information about those bans.
    async findActiveBans({ nickname = null, ip = null, range = null, serial = null } = {}) {
        if (nickname !== null && typeof nickname !== 'string')
            throw new Error('The given |nickname| should either be a string, or NULL.');
        
        if (ip !== null && typeof ip !== 'string')
            throw new Error('The given |ip| address should either be a string, or NULL.');
        
        if (range !== null && typeof range !== 'string')
            throw new Error('The given IP |range| should either be a string, or NULL.');

        if (serial !== null && typeof serial !== 'number')
            throw new Error('The given |serial| should either be a string, or NULL.');

        if (!nickname && !ip && !range && !serial)
            throw new Error('At least one of |nickname|, |ip|, |range| or |serial| must be given.');

        let ipRangeStart = 0;
        let ipRangeEnd = 0;

        if (range !== null) {
            ipRangeStart = ip2long(range.replace(/\*/g, '0'));
            ipRangeEnd = ip2long(range.replace(/\*/g, '255'));
        } else if (ip !== null) {
            ipRangeStart = ip2long(ip);
            ipRangeEnd = ipRangeStart;
        }

        const result = await this._findActiveBansQuery({
            nickname: nickname ?? '',
            ipRangeStart, ipRangeEnd,
            serial: serial ?? 0,
        });
    
        const bans = [];
        for (const row of result)
            bans.push(this.toBanInformation(row));

        return bans;
    }

    // Actually runs the database query to find the active bans given the conditionals.
    async _findActiveBansQuery({ nickname, ipRangeStart, ipRangeEnd, serial }) {
        const result = await server.database.query(
            FIND_ACTIVE_BANS_QUERY, ipRangeStart, ipRangeStart, ipRangeEnd, serial, serial,
            nickname, nickname);

        return result ? result.rows : [];
    }

    // Unbans the given |logId|. All the necessary checks must already have been done.
    async unban(logId) {
        await server.database.query(UNBAN_QUERY, logId);
    }

    // Gets an array of { range, count } entries for all ranges that have exceptions.
    async getRangesWithExceptions() {
        const results = await this._getRangesWithExceptionsQuery();
        const ranges = [];

        for (const row of results) {
            ranges.push({
                range: rangeToText(long2ip(row.ip_range_begin), long2ip(row.ip_range_end)),
                count: row.exception_count,
            }); 
        }

        return ranges;
    }

    // Actually runs the query to get IP ranges that have one or more exceptions.
    async _getRangesWithExceptionsQuery() {
        const result = await server.database.query(RANGE_EXCEPTION_LIST_ALL_QUERY);
        return result ? result.rows : [];
    }

    // Gets an array of { id, date, author, tally, nickname } entries for all exceptions that have
    // been added for the given |range|. Ordered by the exception's tally.
    async getRangeExceptions(range) {
        const ipRangeStart = ip2long(range.replace(/\*/g, '0'));
        const ipRangeEnd = ip2long(range.replace(/\*/g, '255'));

        const results = await this._getRangeExceptionsQuery(ipRangeStart, ipRangeEnd);
        const exceptions = [];

        for (const row of results) {
            exceptions.push({
                id: row.exception_id,
                date: new Date(row.exception_date),
                author: row.exception_author,
                tally: row.exception_tally,
                nickname: row.nickname,
            });
        }

        return exceptions;
    }

    // Actually runs the query to get the exceptions that have been added for a particular range.
    async _getRangeExceptionsQuery(ipRangeStart, ipRangeEnd) {
        const result = await server.database.query(
            RANGE_EXCEPTION_LIST_QUERY, ipRangeStart, ipRangeEnd);

        return result ? result.rows : [];
    }

    // Adds a range exception for the given |nickname|, who's caught by the given |range|.
    async addRangeException(range, nickname, author) {
        const ipRangeStart = ip2long(range.replace(/\*/g, '0'));
        const ipRangeEnd = ip2long(range.replace(/\*/g, '255'));

        await server.database.query(
            RANGE_EXCEPTION_ADD_QUERY, author, ipRangeStart, ipRangeEnd, nickname);
    }

    // Removes a range exception identified by the given |rangeId|.
    async removeRangeException(rangeId) {
        await server.database.query(RANGE_EXCEPTION_DELETE_QUERY, rangeId);
    }

    // Converts the given |row| to a ban information structure, containing the same information in a
    // more idiomatic, usable manner.
    toBanInformation(row) {
        let information = {
            id: row.log_id,
            type: row.log_type,
            date: new Date(row.log_date),
            expiration: new Date(row.ban_expiration_date),
            reason: row.description,
            issuedBy: row.user_nickname,
            nickname: row.subject_nickname,

            // One of the following will be given, depending on the type of ban. For non-ban types
            // this information will be omitted instead.
            ip: null,
            range: null,
            serial: null,
        };

        if (row.ban_ip_range_start !== row.ban_ip_range_end) {
            information.range = rangeToText(long2ip(row.ban_ip_range_start),
                                            long2ip(row.ban_ip_range_end));
        } else if (row.ban_ip_range_start !== 0) {
            information.ip = long2ip(row.ban_ip_range_start);
        } else if (row.gpci_hash !== 0) {
            information.serial = row.gpci_hash;
        }

        return information;
    }
}
