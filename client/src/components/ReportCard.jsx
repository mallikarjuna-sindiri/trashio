import StatusBadge from './StatusBadge';

export default function ReportCard({ report, apiOrigin }) {
  const beforeUrl = report.before_image_url?.startsWith('http')
    ? report.before_image_url
    : `${apiOrigin}${report.before_image_url}`;

  const afterUrl = report.after_image_url
    ? report.after_image_url.startsWith('http')
      ? report.after_image_url
      : `${apiOrigin}${report.after_image_url}`
    : null;

  return (
    <div className="card">
      <div className="row space">
        <div>
          <div className="muted">Report</div>
          <div className="title">{report.description}</div>
          <div className="muted">
            {report.location?.lat}, {report.location?.lng}
          </div>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <div className="images">
        <div>
          <div className="muted">Before</div>
          <img className="img" src={beforeUrl} alt="before" />
        </div>
        {afterUrl && (
          <div>
            <div className="muted">After</div>
            <img className="img" src={afterUrl} alt="after" />
          </div>
        )}
      </div>
    </div>
  );
}
