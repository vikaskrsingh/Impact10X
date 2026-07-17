interface Props {
  title: string;
  value: string;
}

export default function StatCard({ title, value }: Props) {
  return (
    <div className="glass-panel rounded-xl shadow-md p-6 flex-1">

      <p className="text-slate-400">{title}</p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>

    </div>
  );
}