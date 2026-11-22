import { useCallback, useEffect, useState } from "react";

// Loads data from the API and keeps track of loading and errors.
// `load` is a function that returns a promise. It runs again when `deps` change.
// Returns { data, error, loading, reload, setData }.
export function useApi(load, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false; // stops an old answer from replacing a newer one
    // Clear old data, so a new city never shows the old city's suppliers.
    setState({ data: null, error: null, loading: true });
    load()
      .then((data) => !ignore && setState({ data, error: null, loading: false }))
      .catch((error) => !ignore && setState({ data: null, error, loading: false }));
    return () => {
      ignore = true;
    };
    // `load` is usually a new arrow function each render, so we use `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback(
    (data) => setState({ data, error: null, loading: false }),
    [],
  );
  return { ...state, reload, setData };
}
