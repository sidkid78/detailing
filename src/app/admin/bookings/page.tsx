
export default function AdminBookingsPage() {
  // Placeholder data for bookings
  const bookings = [
    { id: '1', customerName: 'John Doe', service: 'Exterior Detail', date: '2023-10-26', status: 'Confirmed' },
    { id: '2', customerName: 'Jane Smith', service: 'Full Interior', date: '2023-10-27', status: 'Pending' },
    { id: '3', customerName: 'Peter Jones', service: 'Premium Wash', date: '2023-10-27', status: 'Completed' },
    { id: '4', customerName: 'Alice Brown', service: 'Ceramic Coating', date: '2023-10-28', status: 'Confirmed' },
  ];

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Bookings</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Service
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th> {/* Actions Column */}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{booking.id}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{booking.customerName}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{booking.service}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{booking.date}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span
                    className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                      booking.status === 'Confirmed' ? 'text-green-900' :
                      booking.status === 'Pending' ? 'text-orange-900' :
                      'text-blue-900'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 opacity-50 rounded-full ${
                        booking.status === 'Confirmed' ? 'bg-green-200' :
                        booking.status === 'Pending' ? 'bg-orange-200' :
                        'bg-blue-200'
                      }`}
                    ></span>
                    <span className="relative">{booking.status}</span>
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <a href="#" className="text-indigo-600 hover:text-indigo-900">Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
