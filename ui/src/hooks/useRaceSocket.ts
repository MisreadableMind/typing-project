import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '../api/socket';
import { useRaceStore } from '../store/raceStore';
import { Race } from '../types';

export function useRaceSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setRace,
    setCountdown,
    setIsRacing,
    updatePlayerProgress,
    setRaceTimer,
    setTimedOut,
    reset,
  } = useRaceStore();

  useEffect(() => {
    socketRef.current = connectSocket();
    const socket = socketRef.current;

    socket.on('raceState', (race: Race) => {
      setRace(race);
    });

    socket.on('countdown', ({ count }: { count: number }) => {
      setCountdown(count);
    });

    socket.on('raceStart', ({ race }: { race: Race }) => {
      setRace(race);
      setCountdown(null);
      setIsRacing(true);
    });

    socket.on('raceTimer', ({ remaining, total }: { remaining: number; total: number }) => {
      setRaceTimer({ remaining, total });
    });

    socket.on('raceTimeout', () => {
      setTimedOut(true);
    });

    socket.on('playerProgress', (progress: {
      userId: string;
      username: string;
      progress: number;
      wpm: number;
      accuracy: number;
    }) => {
      updatePlayerProgress(progress);
    });

    socket.on('playerFinished', (data: {
      userId: string;
      username: string;
      rank: number;
      wpm: number;
      accuracy: number;
    }) => {
      updatePlayerProgress({
        userId: data.userId,
        username: data.username,
        progress: 100,
        wpm: data.wpm,
        accuracy: data.accuracy,
      });
    });

    socket.on('raceComplete', ({ race }: { race: Race }) => {
      setRace(race);
      setIsRacing(false);
      setRaceTimer(null);
    });

    socket.on('playerJoined', ({ username }: { userId: string; username: string }) => {
      console.log(`${username} joined the race`);
    });

    socket.on('playerLeft', ({ username }: { userId: string; username: string }) => {
      console.log(`${username} left the race`);
    });

    return () => {
      socket.off('raceState');
      socket.off('countdown');
      socket.off('raceStart');
      socket.off('raceTimer');
      socket.off('raceTimeout');
      socket.off('playerProgress');
      socket.off('playerFinished');
      socket.off('raceComplete');
      socket.off('playerJoined');
      socket.off('playerLeft');
      disconnectSocket();
    };
  }, [setRace, setCountdown, setIsRacing, updatePlayerProgress, setRaceTimer, setTimedOut]);

  const findRace = useCallback((difficulty?: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('findRace', { difficulty });
    }
  }, []);

  const setReady = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('ready');
    }
  }, []);

  const sendProgress = useCallback((progress: number, wpm: number, accuracy: number) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('progress', { progress, wpm, accuracy });
    }
  }, []);

  const sendFinish = useCallback((wpm: number, accuracy: number) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('finish', { wpm, accuracy });
    }
  }, []);

  const leaveRace = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('leaveRace');
    }
    reset();
  }, [reset]);

  const createPrivateRace = useCallback((difficulty?: string): Promise<{ inviteCode?: string }> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (socket) {
        socket.emit('createPrivateRace', { difficulty }, (response: { success: boolean; inviteCode?: string }) => {
          resolve({ inviteCode: response.inviteCode });
        });
      } else {
        resolve({});
      }
    });
  }, []);

  const joinByInvite = useCallback((inviteCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (socket) {
        socket.emit('joinByInvite', { inviteCode }, (response: { success: boolean }) => {
          resolve(response.success);
        });
      } else {
        resolve(false);
      }
    });
  }, []);

  const creatorStart = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (socket) {
        socket.emit('creatorStart', {}, (response: { success: boolean }) => {
          resolve(response.success);
        });
      } else {
        resolve(false);
      }
    });
  }, []);

  return {
    findRace,
    setReady,
    sendProgress,
    sendFinish,
    leaveRace,
    createPrivateRace,
    joinByInvite,
    creatorStart,
  };
}
