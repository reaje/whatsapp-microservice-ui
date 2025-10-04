import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { sessionService } from '@/services/session.service';
import { supabaseService } from '@/services/supabase.service';
import {
  setSessions,
  addSession,
  updateSession,
  removeSession,
  setActiveSession,
  setLoading as setSessionLoading
} from '@/store/slices/sessionSlice';
import { QUERY_KEYS, QR_CODE_POLLING_INTERVAL } from '@/utils/constants';
import { getErrorMessage } from '@/utils/helpers';
import type { RootState } from '@/store';
import type { InitializeSessionRequest, Session } from '@/types';

export const useSession = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { sessions, activeSession, loading } = useSelector((state: RootState) => state.session);
  const { user } = useSelector((state: RootState) => state.auth);

  // Fetch all sessions
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useQuery({
    queryKey: [QUERY_KEYS.SESSIONS],
    queryFn: sessionService.getAllSessions,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update Redux when sessions change
  useEffect(() => {
    if (sessionsData) {
      console.log('📊 Sessions data received:', sessionsData);
      dispatch(setSessions(sessionsData));
    }
  }, [sessionsData, dispatch]);

  // Initialize session mutation
  const initializeSessionMutation = useMutation({
    mutationFn: (request: InitializeSessionRequest) =>
      sessionService.initializeSession(request),
    onSuccess: (data) => {
      const newSession = sessionService.mapToSession(data);
      dispatch(addSession(newSession));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
      toast.success('Sessão inicializada com sucesso!');
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(`Erro ao inicializar sessão: ${message}`);
    },
  });

  // Disconnect session mutation
  const disconnectSessionMutation = useMutation({
    mutationFn: (phoneNumber: string) =>
      sessionService.disconnectSession(phoneNumber),
    onSuccess: (_, phoneNumber) => {
      dispatch(removeSession(phoneNumber));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
      toast.success('Sessão desconectada com sucesso!');
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(`Erro ao desconectar sessão: ${message}`);
    },
  });

  // Get session status
  const getSessionStatus = useCallback(async (phoneNumber: string) => {
    try {
      const status = await sessionService.getSessionStatus(phoneNumber);
      const session = sessionService.mapToSession(status);
      dispatch(updateSession(session));
      return status;
    } catch (error) {
      console.error('Error getting session status:', error);
      return null;
    }
  }, [dispatch]);

  // Subscribe to session updates via Supabase
  useEffect(() => {
    if (!user?.clientId) return;

    const channel = supabaseService.subscribeToSessionStatus(
      user.clientId,
      (session) => {
        const updatedSession = sessionService.mapToSession({
          isConnected: session.is_active,
          phoneNumber: session.phone_number,
          status: session.is_active ? 'connected' : 'disconnected',
          connectedAt: session.updated_at,
          metadata: null,
        });
        dispatch(updateSession(updatedSession));
      }
    );

    return () => {
      supabaseService.unsubscribe(`sessions:${user.clientId}`);
    };
  }, [user?.clientId, dispatch]);

  return {
    sessions,
    activeSession,
    loading: loading || sessionsLoading,
    initializeSession: initializeSessionMutation.mutateAsync,
    disconnectSession: disconnectSessionMutation.mutateAsync,
    getSessionStatus,
    refetchSessions,
    setActiveSession: (session: Session | null) => dispatch(setActiveSession(session)),
  };
};

// Hook for QR Code polling
export const useQRCode = (phoneNumber: string | null, enabled: boolean = false) => {
  const { data: qrCode, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEYS.SESSION_STATUS, 'qrcode', phoneNumber],
    queryFn: () => sessionService.getQRCode(phoneNumber!),
    enabled: enabled && !!phoneNumber,
    refetchInterval: QR_CODE_POLLING_INTERVAL,
    retry: false,
  });

  return {
    qrCode,
    loading: isLoading,
    refetch,
  };
};
