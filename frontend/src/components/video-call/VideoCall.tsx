import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { VideoCallService } from '../../api/VideoCall/videoCallService';
import { useSelector } from 'react-redux';
import { selectAdminAuthData, selectEmployeeAuthData } from '../../store/selectors';

interface VideoCallProps {
  appID: number;
  serverSecret: string;
  roomID: string;
  onCallEnd: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  appID,
  serverSecret,
  roomID,
  onCallEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { employeeData } = useSelector(selectEmployeeAuthData);
  const { adminData } = useSelector(selectAdminAuthData);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !roomID) {
      if (!roomID) {
        console.error('VideoCall: missing roomID, cannot join Zego room.');
      }
      return;
    }

    const generateToken = () => {
      return ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        Date.now().toString(),
        'Host'
      );
    };

    const token = generateToken();
    if (!token) {
      console.error('VideoCall: failed to generate Zego token.');
      return;
    }

    const zp = ZegoUIKitPrebuilt.create(token);

    try {
      zp.joinRoom({
        container,
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
        onLeaveRoom: async () => {
          try {
            if (employeeData?.id) {
              await VideoCallService.updateParticipants(roomID, [
                {
                  employeeId: employeeData.id,
                  employeeName: employeeData.employeeName || 'Unknown Employee',
                  leftAt: new Date().toISOString(),
                },
              ]);
            }
          } catch (error) {
            console.error('Failed to update participant leftAt:', error);
          }

          try {
            if (adminData?.id) {
              await VideoCallService.endCall(roomID);
            }
          } catch (error) {
            console.error('Failed to end call history:', error);
          }

          if (onCallEnd) {
            onCallEnd();
          }
        },
        onUserLeave: (users) => {
          // no-op for now
        },
      });
    } catch (error) {
      console.error('VideoCall: failed to join room:', error);
    }

    return () => {
      zp.destroy();
    };
  }, [appID, serverSecret, roomID, onCallEnd, employeeData, adminData]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    />
  );
};
