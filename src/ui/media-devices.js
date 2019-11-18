//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';

import toast from 'cogo-toast';
import { faDesktop, faVideo } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import MediaDevice from './media-device';
import {
  isDisplayCaptureSupported,
  isUserCaptureSupported,
} from "../util";
import Notification from './notification';

function startDisplayCapture(displayMediaOptions) {
  return navigator.mediaDevices.getDisplayMedia(displayMediaOptions).catch(err => {
    console.error('Error:' + err);
    toast.error('Your browser does not permit to capture the screen.');
    return null;
  });
}

function startUserCapture(userMediaOptions) {
  const userMediaPromise = navigator.mediaDevices.getUserMedia(userMediaOptions);

  return userMediaPromise.catch(err => {
    console.error('Error:' + err);
    toast.error('Your browser does not permit to capture your webcam.');
    return null;
  });
}

function MediaDevices(props) {
  const { t } = useTranslation();

  function requestDisplayMedia() {
    startDisplayCapture({ video: true, audio: true }).then(desktopStream => {
      props.setDesktopStream(desktopStream);
    });
  }

  function requestUserMedia() {
    startUserCapture({
      audio: true,
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      }
    }).then(videoStream => {
      props.setVideoStream(videoStream);
    });
  }

  return (
    <div
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: ['column', 'row'],
        justifyContent: 'center',
        flexWrap: 'wrap',
        '& > *': {
          flex: '1 0 50%'
        }
      }}
    >
      {isDisplayCaptureSupported() && (
        <MediaDevice
          onClick={requestDisplayMedia}
          title={t('share-desktop')}
          deviceType="desktop"
          icon={faDesktop}
          stream={props.desktopStream}
        />
      )}

      {isUserCaptureSupported() && (
        <MediaDevice
          onClick={requestUserMedia}
          title={t('share-camera')}
          deviceType="video"
          icon={faVideo}
          stream={props.videoStream}
        />
      )}

      {!isDisplayCaptureSupported() && !isUserCaptureSupported() && (
        <div sx={{ p: 3 }}>
          <Notification isDanger>
            Your browser does not allow capturing your display or any other media input.
          </Notification>
        </div>
      )}
    </div>
  );
}

export default MediaDevices;