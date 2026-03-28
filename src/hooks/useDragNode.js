import { useOrgStore } from '../stores/orgStore';
import { isDescendant, findParent } from '../utils/treeUtils';

export function useDragNode(nodeId) {
  const {
    tree, draggingNodeId, dropTargetId,
    setDragging, setDropTarget, clearDragState, moveNodeTo
  } = useOrgStore();

  const isRoot = nodeId === 'dg';
  const isDragging = draggingNodeId === nodeId;
  const isDropTarget = dropTargetId === nodeId;

  const canDrop = (draggedId, targetId) => {
    if (!draggedId || !targetId) return false;
    if (draggedId === targetId) return false;
    if (isDescendant(tree, draggedId, targetId)) return false;
    const parent = findParent(tree, draggedId);
    if (parent && parent.id === targetId) return false;
    return true;
  };

  const dragProps = isRoot ? {} : {
    draggable: true,
    onDragStart: (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', nodeId);
      e.dataTransfer.effectAllowed = 'move';
      // Small delay so the drag image renders properly
      setTimeout(() => setDragging(nodeId), 0);
    },
    onDragEnd: () => {
      clearDragState();
    },
  };

  const dropProps = {
    onDragOver: (e) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = draggingNodeId;
      if (canDrop(draggedId, nodeId)) {
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(nodeId);
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    onDragEnter: (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragLeave: (e) => {
      e.stopPropagation();
      // Only clear if leaving this node (not entering a child)
      if (!e.currentTarget.contains(e.relatedTarget)) {
        if (dropTargetId === nodeId) setDropTarget(null);
      }
    },
    onDrop: (e) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (canDrop(draggedId, nodeId)) {
        moveNodeTo(draggedId, nodeId);
      }
      clearDragState();
    },
  };

  return { dragProps, dropProps, isDragging, isDropTarget, draggingNodeId };
}
