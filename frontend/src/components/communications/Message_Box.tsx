import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";

import useStyles from "./Message_Box_style";
import { Message, useDeliveryMessages } from "../../store/useDeliveryMessages";
import { m } from "framer-motion";

const quickMessageGroup = {
  "Arriving soon": `Hi, I'm on my way. Will be there soon.`,
  "I'm nearby": `Some text`,
  "I'm arrived": `Some Message`,
  "At your doorstep": `Please collect you delivery.`,
} as const;

type MsgTitle = keyof typeof quickMessageGroup;
const quickMessages = Object.keys(quickMessageGroup) as MsgTitle[];

// export type Message = {
//   messageText: string;
//   sentAt: Date;
// };

interface Props {
  inBox?: boolean;
  deliveryId: string;
  onClose: (clicked: boolean) => void;
}

const MessageBox = ({ inBox = false, deliveryId, onClose }: Props) => {
  const styles = useStyles();

  const { messagesByDeliveryId, addMessage, getMessages } =
    useDeliveryMessages();

  const [msgsSent, setMsgsSent] = useState<Message[]>([]);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const messages = getMessages(deliveryId);
    console.log(messages);
    setMsgsSent(messages);
  }, [messagesByDeliveryId, addMessage, getMessages, deliveryId]);

  const handleMessageSend = (key: MsgTitle) => {
    const newMessage: Message = {
      messageText: quickMessageGroup[key],
      sentAt: new Date().toISOString(),
    };
    addMessage(deliveryId, newMessage);
    console.info(deliveryId, newMessage);
    // setMsgsSent((prevMsge) => [newMessage, ...prevMsge]);
    // setMsgsSent((s) => [quickMessageGroup[key], ...s]);
  };

  useEffect(() => {
    if (inBox && lastMsgRef.current) {
      lastMsgRef.current.scrollTop = lastMsgRef.current.scrollHeight;

      // } else {
      //   lastMsgRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [msgsSent, lastMsgRef, inBox]);

  const getTimeStamp = useCallback((sentAt: string) => {
    const msgTime = new Date(sentAt).getTime();
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - msgTime) / 1000);

    if (diffSeconds < 5) {
      return "now";
    } else if (diffSeconds < 12) {
      return "a minute ago";
    } else {
      return new Date(sentAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }, []);

  const timestampRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      timestampRefs.current.forEach((el, key) => {
        const msg = msgsSent.find((m) => new Date(m.sentAt).getTime() === key);
        if (el && msg) {
          el.textContent = getTimeStamp(msg.sentAt);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [msgsSent, getTimeStamp]);

  return (
    <Box className={inBox ? styles.messageBox_bg_inBox : styles.messageBox_bg}>
      {/* Header */}
      {!inBox && (
        <Box className={styles.messageBox_header}>
          <Typography variant="h6" fontWeight={"bold"} color={"white"}>
            Send Message
          </Typography>
          <IconButton onClick={() => onClose(true)} sx={{ color: "white" }}>
            <CloseIcon fontSize="medium" />
          </IconButton>
        </Box>
      )}

      {/* Quick Messages */}
      <Stack spacing={2} sx={{ p: inBox ? 0 : 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: inBox ? 0 : 1 }}>
          {quickMessages.map((item) => (
            <Chip
              key={item}
              onClick={() => handleMessageSend(item)}
              className={inBox ? styles.chip_sm : styles.chip}
              label={item}
              variant="outlined"
            />
          ))}
        </Box>

        <Divider color={grey[600]} />
      </Stack>

      {/*Message List */}
      <Box
        sx={{
          overflowY: "auto",
          flex: 1,
          pt: inBox ? 2 : 0,
          pl: inBox ? 0 : 2,
          pr: 1,
        }}
      >
        <Stack spacing={inBox ? 1 : 2}>
          {msgsSent.map((item, index) => {
            const key = new Date(item.sentAt).getTime();
            return (
              <Box
                key={key}
                display={"flex"}
                alignItems={"space-between"}
                flexDirection={"column"}
                gap={0}
              >
                <Box display={"flex"}>
                  <Typography
                    key={index}
                    variant="body1"
                    sx={{
                      bgcolor: "white",
                      lineHeight: 1.1,
                      border: "1px solid",
                      borderRadius: 3,
                      borderBottomLeftRadius: 1,
                      p: 1,
                      boxShadow: 1,
                    }}
                  >
                    {item.messageText}
                  </Typography>
                </Box>
                <Box display={"flex"} justifyContent={"flex-end"}>
                  <Typography
                    variant="subtitle2"
                    ref={(el) => {
                      if (el) {
                        timestampRefs.current.set(key, el);
                      } else {
                        timestampRefs.current.delete(key);
                      }
                    }}
                  >
                    {getTimeStamp(item.sentAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <Box ref={lastMsgRef} />
        </Stack>
      </Box>
    </Box>
  );
};

export default MessageBox;
