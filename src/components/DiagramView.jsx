import DiagramNode from './DiagramNode';

export default function DiagramView({ tree }) {
  return (
    <div className="diagram-tree inline-flex flex-col items-center p-8">
      <DiagramNode node={tree} />
    </div>
  );
}
