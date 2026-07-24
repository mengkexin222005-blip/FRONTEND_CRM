export default function Dashboard() {
  return (
    <>
      <div className="py-5 grid grid-rows-2 md:grid-cols-4 gap-4">
        <div className="row-span-1 bg-white shadow rounded-md p-6">
          <h2 className="text-gray-500 text-sm">Total Users</h2>
          <p className="text-3xl font-bold mt-2">120</p>
        </div>

        <div className="row-span-1 bg-white shadow rounded-md p-6">
          <h2 className="text-gray-500 text-sm">Total Sales</h2>
          <p className="text-3xl font-bold mt-2">₱54,000</p>
        </div>

        <div className="row-span-2 bg-white shadow rounded-md p-6">
          <h2 className="text-gray-500 text-sm">Recent Users</h2>
          <p className="text-3xl font-bold mt-2">120</p>
        </div>

        <div className="row-span-2 bg-white shadow rounded-md p-6">
          <h2 className="text-gray-500 text-sm">Monthly Sales</h2>
          <p className="text-3xl font-bold mt-2">₱54,000</p>
        </div>

        <div className="row-span-1 bg-white shadow rounded-md p-6">
          <h2 className="text-gray-500 text-sm">Weekly Sales</h2>
          <p className="text-3xl font-bold mt-2">₱54,000</p>
        </div>

        <div className="row-span-1 bg-white shadow rounded-md p-6">
          <h2 className="text-gray-500 text-sm">Daily Sales</h2>
          <p className="text-3xl font-bold mt-2">₱54,000</p>
        </div>
      </div>
    </>
  );
}
