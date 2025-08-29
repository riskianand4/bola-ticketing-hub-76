import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type ChannelSubscription = {
  channel: RealtimeChannel;
  retry: boolean;
  maxRetries: number;
  currentRetries: number;
};

const activeChannels = new Map<string, ChannelSubscription>();

export const createRealtimeSubscription = (
  channelName: string,
  subscriptionConfig: any,
  callback: (payload: any) => void,
  maxRetries = 3
) => {
  // Clean up existing channel if it exists
  if (activeChannels.has(channelName)) {
    const existing = activeChannels.get(channelName);
    if (existing) {
      supabase.removeChannel(existing.channel);
      activeChannels.delete(channelName);
    }
  }

  const createChannel = () => {
    console.log(`Creating realtime channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', subscriptionConfig, callback)
      .subscribe((status, err) => {
        console.log(`Channel ${channelName} status:`, status);
        
        if (status === 'CHANNEL_ERROR' && err) {
          console.error(`Channel ${channelName} error:`, err);
          
          const subscription = activeChannels.get(channelName);
          if (subscription && subscription.retry && subscription.currentRetries < subscription.maxRetries) {
            console.log(`Retrying channel ${channelName} (${subscription.currentRetries + 1}/${subscription.maxRetries})`);
            subscription.currentRetries++;
            
            // Exponential backoff
            setTimeout(() => {
              supabase.removeChannel(subscription.channel);
              const newChannel = createChannel();
              subscription.channel = newChannel;
            }, Math.pow(2, subscription.currentRetries) * 1000);
          } else {
            console.error(`Max retries reached for channel ${channelName}, giving up`);
            activeChannels.delete(channelName);
          }
        } else if (status === 'SUBSCRIBED') {
          console.log(`Channel ${channelName} successfully subscribed`);
          const subscription = activeChannels.get(channelName);
          if (subscription) {
            subscription.currentRetries = 0; // Reset retry count on successful connection
          }
        }
      });

    return channel;
  };

  const channel = createChannel();
  
  activeChannels.set(channelName, {
    channel,
    retry: true,
    maxRetries,
    currentRetries: 0,
  });

  return () => {
    console.log(`Cleaning up channel: ${channelName}`);
    const subscription = activeChannels.get(channelName);
    if (subscription) {
      subscription.retry = false; // Prevent retries when intentionally cleaning up
      supabase.removeChannel(subscription.channel);
      activeChannels.delete(channelName);
    }
  };
};

export const cleanupAllChannels = () => {
  console.log('Cleaning up all realtime channels');
  activeChannels.forEach((subscription, channelName) => {
    subscription.retry = false;
    supabase.removeChannel(subscription.channel);
  });
  activeChannels.clear();
};