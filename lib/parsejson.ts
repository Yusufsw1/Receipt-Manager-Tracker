export function cleanjson(str: any) {
  return str
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}
