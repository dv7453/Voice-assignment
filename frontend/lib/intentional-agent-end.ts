let intentionalAgentEnd = false;

export function markIntentionalAgentEnd() {
  intentionalAgentEnd = true;
}

export function consumeIntentionalAgentEnd(): boolean {
  if (!intentionalAgentEnd) {
    return false;
  }
  intentionalAgentEnd = false;
  return true;
}
