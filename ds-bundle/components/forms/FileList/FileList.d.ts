import * as React from 'react';

/**
 * FileList — from @stiletdekor/ui@0.1.0.
 */
export interface FileListProps {
  items: readonly FileListItem[];
  /** Shows a remove button per file. */
  onRemove?: (id: string) => void;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const FileList: React.ComponentType<FileListProps>;
