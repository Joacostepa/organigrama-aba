export function findNode(tree, id) {
  if (tree.id === id) return tree;
  for (const child of tree.children || []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(tree, id) {
  for (const child of tree.children || []) {
    if (child.id === id) return tree;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function updateNode(tree, id, updates) {
  if (tree.id === id) {
    return { ...tree, ...updates, updatedAt: new Date().toISOString() };
  }
  return {
    ...tree,
    children: (tree.children || []).map(child => updateNode(child, id, updates))
  };
}

export function addChild(tree, parentId, newNode) {
  if (tree.id === parentId) {
    return {
      ...tree,
      children: [...(tree.children || []), newNode],
      updatedAt: new Date().toISOString()
    };
  }
  return {
    ...tree,
    children: (tree.children || []).map(child => addChild(child, parentId, newNode))
  };
}

export function removeNode(tree, id, reparent = false) {
  const newChildren = [];
  for (const child of tree.children || []) {
    if (child.id === id) {
      if (reparent && child.children?.length) {
        newChildren.push(...child.children);
      }
    } else {
      newChildren.push(removeNode(child, id, reparent));
    }
  }
  return { ...tree, children: newChildren };
}

export function moveNode(tree, nodeId, newParentId) {
  const node = findNode(tree, nodeId);
  if (!node) return tree;
  const withoutNode = removeNode(tree, nodeId, false);
  return addChild(withoutNode, newParentId, node);
}

export function countNodes(tree) {
  let count = 1;
  for (const child of tree.children || []) {
    count += countNodes(child);
  }
  return count;
}

export function countVacant(tree) {
  let count = tree.responsableId ? 0 : 1;
  for (const child of tree.children || []) {
    count += countVacant(child);
  }
  return count;
}

export function getAllNodes(tree) {
  const nodes = [tree];
  for (const child of tree.children || []) {
    nodes.push(...getAllNodes(child));
  }
  return nodes;
}

export function getUniqueAreas(tree) {
  const areas = new Map();
  const traverse = (node) => {
    if (node.nodeType === 'area' || node.nodeType === 'direccion') {
      areas.set(node.id, { id: node.id, label: node.label, accent: node.accent, nodeType: node.nodeType });
    }
    (node.children || []).forEach(traverse);
  };
  traverse(tree);
  return Array.from(areas.values());
}

export function isDescendant(tree, ancestorId, nodeId) {
  const ancestor = findNode(tree, ancestorId);
  if (!ancestor) return false;
  // Check if nodeId exists within the subtree of ancestor (excluding ancestor itself)
  const search = (node) => {
    for (const child of node.children || []) {
      if (child.id === nodeId) return true;
      if (search(child)) return true;
    }
    return false;
  };
  return search(ancestor);
}

export function searchTree(tree, query) {
  const q = query.toLowerCase();
  return getAllNodes(tree).filter(node =>
    node.label.toLowerCase().includes(q) ||
    node.subtitle?.toLowerCase().includes(q) ||
    node.desc?.toLowerCase().includes(q) ||
    node.tasks?.some(t => t.toLowerCase().includes(q))
  );
}

/**
 * Returns a Set of node IDs that match the active filters + all their ancestors.
 * If no filters are active, returns null (show everything).
 */
export function getFilteredNodeIds(tree, { searchQuery, filterArea, filterType, filterVacant, people }) {
  const hasFilter = searchQuery || filterArea || filterType || filterVacant;
  if (!hasFilter) return null;

  const allNodes = getAllNodes(tree);
  const q = searchQuery?.toLowerCase() || '';

  // Find nodes that directly match all active filters
  const directMatches = allNodes.filter(node => {
    if (q) {
      const matchesSearch =
        node.label.toLowerCase().includes(q) ||
        node.subtitle?.toLowerCase().includes(q) ||
        node.desc?.toLowerCase().includes(q) ||
        node.tasks?.some(t => t.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (filterType && node.nodeType !== filterType) return false;
    if (filterVacant) {
      const hasResponsable = people?.some(p => p.puestosAsignados.includes(node.id));
      if (hasResponsable) return false;
    }
    if (filterArea) {
      // Check if node is the area or a descendant of it
      const areaNode = findNode(tree, filterArea);
      if (areaNode) {
        if (node.id !== filterArea && !isDescendant(tree, filterArea, node.id)) return false;
      }
    }
    return true;
  });

  // Collect matched IDs + all ancestors so the path to the match is visible
  const visibleIds = new Set();
  for (const match of directMatches) {
    visibleIds.add(match.id);
    // Walk up to root adding ancestors
    let current = match.id;
    let parent = findParent(tree, current);
    while (parent) {
      visibleIds.add(parent.id);
      current = parent.id;
      parent = findParent(tree, current);
    }
  }

  return visibleIds;
}
