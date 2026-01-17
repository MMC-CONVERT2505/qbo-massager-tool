function flattenObject(obj, parentKey = "", result = {}) {
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newKey = parentKey ? `${parentKey}_${key}` : key;
    const value = obj[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

module.exports = flattenObject;
