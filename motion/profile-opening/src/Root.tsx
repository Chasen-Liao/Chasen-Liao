import { Composition } from 'remotion';
import { ProfileOpening } from './Opening';

export const Root = () => <>
  <Composition id="ProfileOpening" component={ProfileOpening} durationInFrames={96} fps={30} width={1600} height={640} defaultProps={{ scheme: 'light' }} />
  <Composition id="ProfileOpeningMobile" component={ProfileOpening} durationInFrames={96} fps={30} width={1080} height={640} defaultProps={{ scheme: 'light' }} />
  <Composition id="ProfileOpeningDark" component={ProfileOpening} durationInFrames={96} fps={30} width={1600} height={640} defaultProps={{ scheme: 'dark' }} />
  <Composition id="ProfileOpeningMobileDark" component={ProfileOpening} durationInFrames={96} fps={30} width={1080} height={640} defaultProps={{ scheme: 'dark' }} />
</>;
