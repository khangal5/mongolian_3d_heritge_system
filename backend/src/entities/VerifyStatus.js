export const VerifyStatus = Object.freeze({
  SUBMITTED: "submitted",
  VERIFIED: "verified"
});

export function isValidVerifyStatus(value) {
  return Object.values(VerifyStatus).includes(value);
}
