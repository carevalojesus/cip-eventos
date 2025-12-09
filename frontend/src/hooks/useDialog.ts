import { useState, useCallback } from "react";

/**
 * Dialog state interface
 */
export interface DialogState<T> {
  isOpen: boolean;
  data: T | null;
  isLoading: boolean;
}

/**
 * Dialog hook return type
 */
export interface UseDialogReturn<T> {
  state: DialogState<T>;
  isOpen: boolean;
  data: T | null;
  isLoading: boolean;
  open: (data?: T) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

/**
 * useDialog - A reusable hook for managing dialog/modal state
 *
 * @example
 * ```tsx
 * const deleteDialog = useDialog<User>();
 *
 * // Open dialog with data
 * deleteDialog.open(user);
 *
 * // In JSX
 * <ConfirmDialog
 *   isOpen={deleteDialog.isOpen}
 *   onClose={deleteDialog.close}
 *   onConfirm={async () => {
 *     deleteDialog.setLoading(true);
 *     await deleteUser(deleteDialog.data.id);
 *     deleteDialog.close();
 *   }}
 *   isLoading={deleteDialog.isLoading}
 * />
 * ```
 */
export function useDialog<T = unknown>(): UseDialogReturn<T> {
  const [state, setState] = useState<DialogState<T>>({
    isOpen: false,
    data: null,
    isLoading: false,
  });

  const open = useCallback((data?: T) => {
    setState({
      isOpen: true,
      data: data ?? null,
      isLoading: false,
    });
  }, []);

  const close = useCallback(() => {
    // Only close if not loading
    setState((prev) => {
      if (prev.isLoading) return prev;
      return {
        isOpen: false,
        data: null,
        isLoading: false,
      };
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isOpen: false,
      data: null,
      isLoading: false,
    });
  }, []);

  return {
    state,
    isOpen: state.isOpen,
    data: state.data,
    isLoading: state.isLoading,
    open,
    close,
    setLoading,
    reset,
  };
}

/**
 * useMultipleDialogs - Manage multiple dialog states with a single hook
 *
 * @example
 * ```tsx
 * const dialogs = useMultipleDialogs<User>(['delete', 'activate', 'resetPassword']);
 *
 * // Open specific dialog
 * dialogs.delete.open(user);
 *
 * // In JSX
 * <ConfirmDialog isOpen={dialogs.delete.isOpen} ... />
 * ```
 */
export function useMultipleDialogs<T = unknown>(
  dialogNames: string[]
): Record<string, UseDialogReturn<T>> {
  const dialogHooks: Record<string, UseDialogReturn<T>> = {};

  dialogNames.forEach((name) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    dialogHooks[name] = useDialog<T>();
  });

  return dialogHooks;
}

export default useDialog;
