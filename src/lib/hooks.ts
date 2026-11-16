import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Load data from SQLite and re-run every time the screen gains focus (or deps change). */
export function useData<T>(loader: (db: SQLiteDatabase) => Promise<T>, deps: unknown[] = []) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  // Callers pass small primitive deps (ids, filters); a stable key keeps the dep list literal.
  const depKey = JSON.stringify(deps);

  const reload = useCallback(async () => {
    try {
      const d = await loaderRef.current(db);
      setData(d);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, depKey]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, loading, reload, db };
}
