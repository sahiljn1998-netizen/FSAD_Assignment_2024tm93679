import { useState, useCallback } from 'react';

/**
 * Custom hook for optimistic UI updates
 * Immediately updates the UI, then rolls back if the async operation fails
 * 
 * @param {Function} asyncFn - The async function to execute
 * @param {Function} optimisticUpdate - Function to update state optimistically (receives currentState)
 * @param {Function} onError - Optional error handler
 * @returns {Object} - { execute, loading, error }
 */
export function useOptimistic(asyncFn, optimisticUpdate, onError) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (currentState, ...args) => {
    setLoading(true);
    setError(null);

    // Store the original state for rollback
    const originalState = currentState;

    // Apply optimistic update immediately
    const optimisticState = optimisticUpdate(currentState, ...args);

    try {
      // Execute the async operation
      const result = await asyncFn(...args);
      setLoading(false);
      return { success: true, data: result, state: optimisticState };
    } catch (err) {
      // Rollback on error
      setError(err);
      setLoading(false);
      if (onError) onError(err);
      return { success: false, error: err, state: originalState };
    }
  }, [asyncFn, optimisticUpdate, onError]);

  return { execute, loading, error };
}

/**
 * Simpler version for state updates that don't need rollback tracking
 * Good for operations where you'll refetch the data anyway
 */
export function useOptimisticUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (setState, optimisticUpdate, asyncFn) => {
    setLoading(true);
    setError(null);

    // Store original state
    let originalState;
    setState(current => {
      originalState = current;
      return optimisticUpdate(current);
    });

    try {
      const result = await asyncFn();
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      // Rollback to original state
      setState(originalState);
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  return { execute, loading, error };
}
