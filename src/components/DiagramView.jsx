import DiagramNode from './DiagramNode';

export default function DiagramView({ tree, filteredIds }) {
  return (
    <div className="diagram-tree inline-flex flex-col items-center p-8">
      <DiagramNode node={tree} filteredIds={filteredIds} />
    </div>
  );
}
