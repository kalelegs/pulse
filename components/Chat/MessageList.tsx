// This component is outer level component rendering a list of messages

import { useChatStore } from '@/hooks';
import { TMessage } from '@/types/ChatStore';

const MessageList = () => {
  const finalisedMessages = useChatStore((state) => state.finalisedMessages);
  const activeMessage = useChatStore((state) => state.activeMessage);

  return (
    <div className="">
      {finalisedMessages.map((message: TMessage) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};

export default MessageList;
