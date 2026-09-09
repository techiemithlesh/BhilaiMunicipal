/**
 * Get nested error from an object using either dot string path or array path.
 */
const getNestedError = (errors, path) => {
  if (!errors || !path) return null;

  const keys = Array.isArray(path)
    ? path
    : path.split(".").map((key) => (isNaN(key) ? key : Number(key)));

  return keys.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
    errors
  );
};

const FormError = ({ path, errors }) => {
  const errorMessage = getNestedError(errors, path);
  if (!errorMessage) return null;

  return <p className="mt-1 text-red-500 text-xs">{errorMessage}</p>;
};

export default FormError;
