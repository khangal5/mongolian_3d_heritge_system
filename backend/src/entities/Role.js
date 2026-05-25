export const Role = Object.freeze({
  VISITOR: "visitor",
  RESEARCHER: "researcher",
  ADMIN: "admin"
});

export function isValidRole(value) {
  return Object.values(Role).includes(value);
}
