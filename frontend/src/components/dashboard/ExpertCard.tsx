import { Bot } from "lucide-react";

interface Props {
  expert: string;
  docs: number;
  trust: number;
}

export default function ExpertCard({
  expert,
  docs,
  trust,
}: Props) {
  return (
    <div className="glass-panel rounded-xl shadow-md p-6">

      <div className="flex justify-between">

        <div>

          <div className="flex gap-3 items-center">

            <Bot className="text-primary glow-text"/>

            <h2 className="font-bold text-xl">

              {expert}

            </h2>

          </div>

          <p className="mt-3">

            Documents : {docs}

          </p>

        </div>

        <div className="text-right">

          <p className="text-slate-400">

            Trust Score

          </p>

          <h2 className="text-green-600 text-3xl">

            {trust}%

          </h2>

        </div>

      </div>

      <button
        className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg"
      >
        Ask Expert
      </button>

    </div>
  );
}