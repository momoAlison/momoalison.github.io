import vitesseLight from '@shikijs/themes/vitesse-light';

// Vitesse Light's stock comment color (#a0ada0) sits at ~2.3:1 contrast on white,
// too faint for an article that relies on explanatory inline comments. This clones
// the approved theme and darkens only the `comment` token scope; every other color
// (keywords, strings, types, functions, numbers, punctuation) is untouched.
const COMMENT_COLOR = '#757575';

const theme = structuredClone(vitesseLight);
theme.name = 'vitesse-light-warm';
theme.displayName = 'Vitesse Light (warm comments)';
for (const token of theme.tokenColors ?? []) {
  const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
  if (scopes.includes('comment')) {
    token.settings = { ...token.settings, foreground: COMMENT_COLOR };
  }
}

export default theme;
