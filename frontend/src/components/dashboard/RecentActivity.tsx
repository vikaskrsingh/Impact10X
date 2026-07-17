export default function RecentActivity() {

  const items = [
    "New GDPR records indexed",
    "AMLD6 Expert updated",
    "MiFID II policy approved",
    "Payments Expert created"
  ];

  return (

    <div className="glass-panel rounded-xl shadow-md p-6">

      <h2 className="font-bold text-xl">

        Recent Activity

      </h2>

      <div className="mt-5 space-y-3">

        {items.map((item) => (

          <div key={item}>

            ✅ {item}

          </div>

        ))}

      </div>

    </div>

  );

}