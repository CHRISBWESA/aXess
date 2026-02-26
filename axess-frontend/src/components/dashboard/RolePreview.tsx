import Badge from '../ui/Badge';
import { Icons } from '../icons';

// Sample table data
const tableData = [
  {
    name: 'Assigned Room',
    descent: 'Room Number',
    family: '6am',
    status: '12:1AM',
    cellDiv: '0:17 Min',
    deal: '02:20 Min',
    action: 'Activities → Room is Busy'
  },
  // Add more rows as needed
];

const RolePreview: React.FC = () => {
  // Sample chart data
  const barData = [
    { name: 'Mon', value: 65 },
    { name: 'Tue', value: 59 },
    { name: 'Wed', value: 80 },
    { name: 'Thu', value: 81 },
    { name: 'Fri', value: 56 },
    { name: 'Sat', value: 55 },
    { name: 'Sun', value: 40 },
  ];

  const lineData = [
    { name: 'Jun', uv: 4000, pv: 2400 },
    { name: 'Jul', uv: 3000, pv: 1398 },
    { name: 'Aug', uv: 2000, pv: 9800 },
    { name: 'Sep', uv: 2780, pv: 3908 },
    { name: 'Oct', uv: 1890, pv: 4800 },
    { name: 'Nov', uv: 2390, pv: 3800 },
    { name: 'Dec', uv: 3490, pv: 4300 },
  ];

  return (
    <div className="role-previews">
      {/* Coordinator */}
      <div className="role-section">
        <div className="role-title">
          Coordinator <Icons.Info size={16} />
        </div>
        <div className="status-cards">
          <div className="status-card green">
            <Badge variant="available">Available</Badge>
            <div className="status-detail">3 der</div>
            <div className="status-detail">Room Key</div>
            <div className="status-detail">Room Number</div>
            <div className="status-detail">Floor</div>
          </div>
          <div className="status-card red">
            <Badge variant="taken">Taken</Badge>
            <div className="status-detail">1 der</div>
            <div className="status-detail">Taken</div>
            <div className="status-detail">Room Number</div>
            <div className="status-detail">Floor</div>
          </div>
          <div className="status-card blue">
            <Badge variant="returned">Returned</Badge>
            <div className="status-detail">3 Room Key</div>
            <div className="status-detail">Room Number</div>
            <div className="status-detail">Floor</div>
          </div>
          <div className="status-card gray">
            <Badge variant="restricted">Restricted</Badge>
            <div className="status-detail">Status</div>
            <div className="status-detail">Floor</div>
          </div>
        </div>
      </div>

      {/* Leader - Timeline */}
      <div className="role-section">
        <div className="role-title">Leader</div>
        <div className="timeline">
          <div className="timeline-step orange">Request Submitted</div>
          <div className="timeline-connector" />
          <div className="timeline-step green">Request Approved</div>
          <div className="timeline-connector" />
          <div className="timeline-step green">Request Approved</div>
          <div className="timeline-connector" />
          <div className="timeline-step green">Request Completed</div>
        </div>
      </div>

      {/* Guard */}
      <div className="role-section">
        <div className="role-title">Guard</div>
        <div className="guard-card">Recent Handover</div>
      </div>

      {/* Innovator Table */}
      <div className="role-section">
        <div className="role-title">Innovator</div>
        <table className="innovator-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Descent</th>
              <th>Family</th>
              <th>Status</th>
              <th>Cell Div</th>
              <th>Deal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td>{row.descent}</td>
                <td>{row.family}</td>
                <td>{row.status}</td>
                <td>{row.cellDiv}</td>
                <td>{row.deal} <span className="green-dot" /></td>
                <td><a href="#" className="table-action">{row.action}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolePreview;