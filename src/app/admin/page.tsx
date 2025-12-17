
export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Total Bookings</h2>
          <p className="text-4xl font-bold text-indigo-600">1,234</p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Pending Bookings</h2>
          <p className="text-4xl font-bold text-orange-500">45</p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">New Detailers</h2>
          <p className="text-4xl font-bold text-green-600">12</p>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Revenue (This Month)</h2>
          <p className="text-4xl font-bold text-purple-600">$12,345</p>
        </div>
      </div>

      {/* Recent Activity/Quick Links Section (Placeholder) */}
      <div className="mt-10 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <p className="text-gray-600">No recent activity to display.</p>
      </div>
    </div>
  );
}
