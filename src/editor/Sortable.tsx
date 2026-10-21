import type { ReactNode } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconDrag } from '../components/icons';

export interface HandleProps {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
}

function Item({ id, children }: { id: string; children: (h: HandleProps, dragging: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: 'relative' }}>
      {children({ attributes, listeners }, isDragging)}
    </li>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  children,
  className = '',
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  children: (item: T, handle: HandleProps, dragging: boolean, index: number) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item, i) => (
            <Item key={item.id} id={item.id}>
              {(h, d) => children(item, h, d, i)}
            </Item>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({ handle, label }: { handle: HandleProps; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted hover:bg-sunken active:cursor-grabbing"
      {...handle.attributes}
      {...handle.listeners}
    >
      <IconDrag size={18} />
    </button>
  );
}
