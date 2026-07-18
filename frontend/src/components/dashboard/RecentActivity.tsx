export default function RecentActivity() {

  const items = [
    "New KYC records indexed",
    "AML Expert updated",
    "Compliance policy approved",
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