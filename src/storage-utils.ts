const COOKIE_NAME = "tokens";

export function saveTokens(tokens) {
  document.cookie = `${COOKIE_NAME}=${JSON.stringify(tokens)}; max-age=${tokens.expires_in}; samesite=strict`;
}

function getCookies(): string {
  return document.cookie ?? "";
}

export function recallTokens() {
  const cookiePair = getCookies()
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`));
  return cookiePair ? cookiePair.split('=')[1] : undefined;
}