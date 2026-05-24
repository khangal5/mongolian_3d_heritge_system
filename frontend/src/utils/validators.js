const CYRILLIC_NAME_REGEX = /^[А-ЯЁӨҮа-яёөү][А-ЯЁӨҮа-яёөү\s\-.]*$/;

export function isCyrillicName(value) {
  if (!value) {
    return false;
  }
  return CYRILLIC_NAME_REGEX.test(value.trim());
}

export function validateCyrillicName(value) {
  if (!value || !value.trim()) {
    return "Овог нэрээ оруулна уу";
  }
  if (!isCyrillicName(value)) {
    return "Овог нэрийг кирилл (монгол) үсгээр бичнэ үү";
  }
  return null;
}