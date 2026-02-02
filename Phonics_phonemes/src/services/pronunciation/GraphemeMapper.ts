/**
 * GraphemeMapper: Segments words into graphemes/phonograms for phonics visualization
 * 
 * Rules based on standard Orton-Gillingham phonics:
 * - Consonants: Blue
 * - Vowels: Red
 * - Digraphs (ch, sh, th...): Green
 * - Vowel Teams (ai, ea, oa...): Purple
 * - R-Controlled (ar, er...): Orange
 */

export interface GraphemeSegment {
    text: string;
    type: 'consonant' | 'vowel' | 'digraph' | 'vowelTeam' | 'rControlled' | 'other';
    color: string;
}

const PHONICS_COLORS = {
    consonant: '#2B3A55', // Ink Blue
    vowel: '#D32F2F',     // Red
    digraph: '#2E7D32',   // Green
    vowelTeam: '#7B1FA2', // Purple
    rControlled: '#E65100', // Deep Orange
    other: '#2B3A55',
};

// Patterns (Order matters: longest first)
const PATTERNS = [
    // 1. R-Controlled Vowels
    { type: 'rControlled', regex: /^(ar|er|ir|or|ur)/i },

    // 2. Vowel Teams & Diphthongs
    { type: 'vowelTeam', regex: /^(ai|ay|ee|ea|ie|ei|oa|oe|ue|ui|oi|oy|au|aw|ou|ow|ew|oo|igh|eigh)/i },

    // 3. Consonant Digraphs
    { type: 'digraph', regex: /^(ch|sh|th|wh|ph|ck|ng|qu|kn|wr)/i },

    // 4. Single Vowels
    { type: 'vowel', regex: /^(a|e|i|o|u|y)/i },

    // 5. Single Consonants (Anything else matching a letter)
    { type: 'consonant', regex: /^[a-z]/i },
];

export const segmentWord = (word: string): GraphemeSegment[] => {
    let remaining = word;
    const segments: GraphemeSegment[] = [];

    while (remaining.length > 0) {
        let matchFound = false;

        // Try to match patterns in priority order
        for (const pattern of PATTERNS) {
            const match = remaining.match(pattern.regex);
            if (match) {
                const text = match[0];
                segments.push({
                    text,
                    type: pattern.type as any,
                    color: PHONICS_COLORS[pattern.type as keyof typeof PHONICS_COLORS],
                });
                remaining = remaining.slice(text.length);
                matchFound = true;
                break;
            }
        }

        // Safety fallback for non-letters (spaces, punctuation)
        if (!matchFound) {
            segments.push({
                text: remaining[0],
                type: 'other',
                color: PHONICS_COLORS.other,
            });
            remaining = remaining.slice(1);
        }
    }

    return segments;
};
