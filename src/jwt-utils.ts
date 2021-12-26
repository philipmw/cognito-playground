export function getJwtSub(jwtString: string): string|undefined {
  if (jwtString == undefined) {
    return undefined;
  }
  const jwtParts = jwtString.split(".");
  const jwtJson = atob(jwtParts[1]);
  return JSON.parse(jwtJson)["sub"];
}