export default function AdminSubscribersPage() {
  return (
    <div>
      <h1>Subscribers</h1>
      <p className="admin-sub">quiet readers; no analytics theatre.</p>

      <table className="admin-table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>email</th>
            <th>tier</th>
            <th>joined</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="empty" colSpan={4}>
              no subscribers yet. probably for the best.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
