'use client';

import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import type React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const AlertDialog: typeof AlertDialogPrimitive.Root = AlertDialogPrimitive.Root;
export const AlertDialogTrigger: typeof AlertDialogPrimitive.Trigger = AlertDialogPrimitive.Trigger;
export const AlertDialogClose: typeof AlertDialogPrimitive.Close = AlertDialogPrimitive.Close;

export function AlertDialogPopup({
  children,
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props): React.ReactElement {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0"
        data-slot="alert-dialog-backdrop"
      />
      <AlertDialogPrimitive.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-transparent bg-popover p-6 text-popover-foreground shadow-lg/5 ring-1 ring-stone-950/10 transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:ring-white/10',
          className
        )}
        data-slot="alert-dialog-popup"
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props): React.ReactElement {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-lg font-medium tracking-tight text-foreground', className)}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props): React.ReactElement {
  return (
    <AlertDialogPrimitive.Description
      className={cn('mt-2 text-sm text-muted-foreground', className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

export function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

export function AlertDialogActions({
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  destructive = false,
}: {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <AlertDialogFooter>
      <AlertDialogClose render={<Button type="button" variant="ghost" disabled={loading} />}>
        {cancelLabel}
      </AlertDialogClose>
      <Button
        type="button"
        variant={destructive ? 'destructive' : 'default'}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </AlertDialogFooter>
  );
}
