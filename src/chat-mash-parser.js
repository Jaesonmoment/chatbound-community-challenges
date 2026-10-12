const MAX_RAW_LENGTH = 280;
const ALLOWED_SEPARATORS = new Set([' ', '\t', '\n', '\r', ',', '.', '-', '_']);
function rejected(reason, normalized, rawLetterCount, ignoredRepeatCount, ignoredSeparatorCount) {
    return {
        ok: false,
        rhythm: null,
        tokenCount: 0,
        normalized,
        rawLetterCount,
        ignoredRepeatCount,
        ignoredSeparatorCount,
        reason,
    };
}
export function parseAlLaChatMash(rawText) {
    const text = (typeof rawText === 'string' ? rawText : '').trim().toLowerCase();
    if (!text)
        return rejected('empty', '', 0, 0, 0);
    if (text.length > MAX_RAW_LENGTH)
        return rejected('too_long', '', 0, 0, 0);
    if (/^[!/?$+.]/.test(text))
        return rejected('command_like', '', 0, 0, 0);
    const chunks = [];
    let currentChunk = '';
    let rawLetterCount = 0;
    let ignoredRepeatCount = 0;
    let ignoredSeparatorCount = 0;
    const pushChunk = () => {
        if (currentChunk)
            chunks.push(currentChunk);
        currentChunk = '';
    };
    for (const ch of text) {
        if (ch === 'a' || ch === 'l') {
            rawLetterCount += 1;
            if (currentChunk.endsWith(ch)) {
                ignoredRepeatCount += 1;
            }
            else {
                currentChunk += ch;
            }
            continue;
        }
        if (ALLOWED_SEPARATORS.has(ch)) {
            ignoredSeparatorCount += 1;
            pushChunk();
            continue;
        }
        if (/[a-z0-9]/.test(ch)) {
            pushChunk();
            return rejected('other_letters', chunks.join(''), rawLetterCount, ignoredRepeatCount, ignoredSeparatorCount);
        }
        pushChunk();
        return rejected('other_letters', chunks.join(''), rawLetterCount, ignoredRepeatCount, ignoredSeparatorCount);
    }
    pushChunk();
    const normalized = chunks.join('');
    if (normalized.length < 4) {
        return rejected('too_short', normalized, rawLetterCount, ignoredRepeatCount, ignoredSeparatorCount);
    }
    const startsWithA = normalized[0] === 'a';
    const rhythm = startsWithA ? 'al' : 'la';
    const tokenCount = chunks.reduce((total, chunk) => total + Math.floor(chunk.length / 2), 0);
    if (tokenCount < 2) {
        return rejected('too_short', normalized, rawLetterCount, ignoredRepeatCount, ignoredSeparatorCount);
    }
    return {
        ok: true,
        rhythm,
        tokenCount,
        normalized,
        rawLetterCount,
        ignoredRepeatCount,
        ignoredSeparatorCount,
    };
}
export function isAlLaChatMash(rawText) {
    return parseAlLaChatMash(rawText).ok;
}
