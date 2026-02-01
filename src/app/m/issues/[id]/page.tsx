import { loadBaseData } from '@/lib/hqData';
import IssueDetailClient from './IssueDetailClient';

// Generate static params for all issues
export function generateStaticParams() {
  const data = loadBaseData();
  return data.issues.map((issue) => ({
    id: issue.id,
  }));
}

export default function MobileIssueDetailPage({ params }: { params: { id: string } }) {
  return <IssueDetailClient issueId={params.id} />;
}
