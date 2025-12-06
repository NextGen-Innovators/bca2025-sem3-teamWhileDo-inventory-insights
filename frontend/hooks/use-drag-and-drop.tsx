import { useState, useCallback, useRef } from 'react';

interface DragState<T = any> {
  draggedItem: T | null;
  sourceColumn: string | null;
  isDragging: boolean;
}

export const useDragAndDrop = <T extends { id: string }>(
  onDrop: (itemId: string, newStatus: string) => void
) => {
  const [dragState, setDragState] = useState<DragState<T>>({
    draggedItem: null,
    sourceColumn: null,
    isDragging: false,
  });

  // Use ref to avoid closure issues
  const draggedItemRef = useRef<T | null>(null);
  const sourceColumnRef = useRef<string | null>(null);

  const handleDragStart = useCallback((item: T, columnId: string) => {
    draggedItemRef.current = item;
    sourceColumnRef.current = columnId;
    
    setDragState({
      draggedItem: item,
      sourceColumn: columnId,
      isDragging: true,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedItemRef.current = null;
    sourceColumnRef.current = null;
    
    setDragState({
      draggedItem: null,
      sourceColumn: null,
      isDragging: false,
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumn: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const draggedItem = draggedItemRef.current;
      const sourceColumn = sourceColumnRef.current;
      
      if (draggedItem && sourceColumn !== targetColumn) {
        onDrop(draggedItem.id, targetColumn);
      }
      
      handleDragEnd();
    },
    [onDrop, handleDragEnd]
  );

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
};