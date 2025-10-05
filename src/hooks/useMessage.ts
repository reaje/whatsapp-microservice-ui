import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { messageService } from '@/services/message.service';
import { supabaseService } from '@/services/supabase.service';
import {
  addMessage,
  setMessages,
  updateMessageStatus,
} from '@/store/slices/chatSlice';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/utils/helpers';
import type { RootState } from '@/store';
import type {
  SendTextMessageRequest,
  SendMediaMessageRequest,
  SendAudioMessageRequest,
  SendLocationMessageRequest,
  Message,
} from '@/types';

export const useMessage = (contactId?: string) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { activeContact, messages } = useSelector((state: RootState) => state.chat);

  // Get messages for active contact
  const contactMessages = contactId ? messages[contactId] : [];

  // Fetch messages from API
  const {
    data: fetchedMessages,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, activeContact?.phoneNumber],
    queryFn: async () => {
      if (!activeContact?.phoneNumber) return [];
      const history = await messageService.getMessageHistory(activeContact.phoneNumber, 100);

      // Map backend response to Message type
      return history.map((msg: any) => ({
        id: msg.id || msg.messageId,
        sessionId: msg.sessionId,
        messageId: msg.messageId,
        fromNumber: msg.fromNumber || msg.from,
        toNumber: msg.toNumber || msg.to,
        type: msg.type,
        content: msg.content || { text: msg.textContent },
        status: msg.status,
        timestamp: new Date(msg.timestamp).toISOString(),
        error: msg.error,
        metadata: msg.metadata,
      }));
    },
    enabled: !!activeContact?.phoneNumber,
  });

  // Update Redux when messages are fetched
  useEffect(() => {
    if (fetchedMessages && contactId) {
      dispatch(setMessages({ contactId, messages: fetchedMessages }));
    }
  }, [fetchedMessages, contactId, dispatch]);

  // Subscribe removido: página Conversations já gerencia realtime por tenant.
  // Isso evita assinatura incorreta por sessionId usando contactId.

  // Send text message mutation
  const sendTextMutation = useMutation({
    mutationFn: (request: SendTextMessageRequest) =>
      messageService.sendText(request),
    onMutate: async (request) => {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sessionId: contactId || '',
        messageId: `temp-${Date.now()}`,
        fromNumber: 'self',
        toNumber: request.to,
        type: 'text',
        content: { text: request.content },
        status: 'sending',
        timestamp: new Date().toISOString(),
      };

      if (contactId) {
        dispatch(addMessage({ contactId, message: optimisticMessage }));
      }

      return { optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      // Update message with real ID and status
      if (contactId && context?.optimisticMessage) {
        dispatch(updateMessageStatus({
          contactId,
          messageId: context.optimisticMessage.messageId,
          status: data.status,
        }));
      }
    },
    onError: (error, variables, context) => {
      const message = getErrorMessage(error);
      toast.error(`Erro ao enviar mensagem: ${message}`);

      // Update optimistic message to failed
      if (contactId && context?.optimisticMessage) {
        dispatch(updateMessageStatus({
          contactId,
          messageId: context.optimisticMessage.messageId,
          status: 'failed',
        }));
      }
    },
  });

  // Send media message mutation
  const sendMediaMutation = useMutation({
    mutationFn: (request: SendMediaMessageRequest) =>
      messageService.sendMedia(request),
    onSuccess: () => {
      toast.success('Mídia enviada com sucesso!');
      refetchMessages();
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(`Erro ao enviar mídia: ${message}`);
    },
  });

  // Send audio message mutation
  const sendAudioMutation = useMutation({
    mutationFn: (request: SendAudioMessageRequest) =>
      messageService.sendAudio(request),
    onSuccess: () => {
      toast.success('Áudio enviado com sucesso!');
      refetchMessages();
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(`Erro ao enviar áudio: ${message}`);
    },
  });

  // Send location message mutation
  const sendLocationMutation = useMutation({
    mutationFn: (request: SendLocationMessageRequest) =>
      messageService.sendLocation(request),
    onSuccess: () => {
      toast.success('Localização enviada com sucesso!');
      refetchMessages();
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(`Erro ao enviar localização: ${message}`);
    },
  });

  // Helper function to play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  return {
    messages: contactMessages,
    loading: messagesLoading,
    sendText: sendTextMutation.mutateAsync,
    sendMedia: sendMediaMutation.mutateAsync,
    sendAudio: sendAudioMutation.mutateAsync,
    sendLocation: sendLocationMutation.mutateAsync,
    refetchMessages,
    isSending: sendTextMutation.isPending ||
               sendMediaMutation.isPending ||
               sendAudioMutation.isPending ||
               sendLocationMutation.isPending,
  };
};
