import { isMobile } from 'react-device-detect';
import MobileTikTokReview from '../components/Common/TiktokReview/MobileTikTokReview';
import DesktopTikTokReview from '../components/Common/TiktokReview/DesktopTikTokReview';

export default function TikTokReviewPage() {
  return isMobile ? <MobileTikTokReview /> : <DesktopTikTokReview />;
}