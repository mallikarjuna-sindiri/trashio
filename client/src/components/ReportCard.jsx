import StatusBadge from './StatusBadge';

export default function ReportCard({ report, apiOrigin }) {
  const beforeUrl = report.before_image_url?.startsWith('http')
    ? report.before_image_url
    : `${apiOrigin}${report.before_image_url}`;

  const beforeThumbUrl = report.before_image_thumb_url
    ? report.before_image_thumb_url.startsWith('http')
      ? report.before_image_thumb_url
      : `${apiOrigin}${report.before_image_thumb_url}`
    : beforeUrl;

  const afterUrl = report.after_image_url
    ? report.after_image_url.startsWith('http')
      ? report.after_image_url
      : `${apiOrigin}${report.after_image_url}`
    : null;

  const afterThumbUrl = report.after_image_thumb_url
    ? report.after_image_thumb_url.startsWith('http')
      ? report.after_image_thumb_url
      : `${apiOrigin}${report.after_image_thumb_url}`
    : afterUrl;

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
          <a href={beforeUrl} target="_blank" rel="noreferrer">
            <img
              className="img"
              src={beforeThumbUrl}
              alt="before"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </a>
        </div>
        {afterUrl && (
          <div>
            <div className="muted">After</div>
            <a href={afterUrl} target="_blank" rel="noreferrer">
              <img
                className="img"
                src={afterThumbUrl}
                alt="after"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
