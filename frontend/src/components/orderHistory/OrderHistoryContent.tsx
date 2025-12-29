import { Box, Divider, Stack, Typography } from "@mui/material";
import { OrderHistory, OrderHistoryUI } from "../../types/order.type";

// const statusColorMap = {
//   delivered: "success.main",
//   cancelled: "error.main",
//   rescheduled: "warning.main",
// };

interface Props {
  data: OrderHistoryUI;
}

const OrderHistoryContent = ({ data }: Props) => {
  return (
    <Stack spacing={2}>
      {data.attempts.map((attempt, index) => (
        <OrderAttemptBlock
          key={attempt.order_id}
          attempt={attempt}
          index={index}
        />
      ))}
    </Stack>
  );
};

export default OrderHistoryContent;

interface AttemptProps {
  attempt: OrderHistoryUI["attempts"][number];
  index: number;
}

const OrderAttemptBlock = ({ attempt, index }: AttemptProps) => {
  return (
    <Box>
      {/* Attempt header */}
      <Stack spacing={0}>
        {attempt.type !== "normal" && (
          <Typography
            variant="subtitle2"
            fontWeight={600}
            // color="secondary.dark"
            sx={{ mb: 1, right: 0 }}
          >
            {attempt.type.toUpperCase()}
          </Typography>
        )}
        <Typography variant="subtitle2" fontWeight={600}>
          Order ID: {attempt.order_id} {"Ref order: " + attempt.parent_order_id}
        </Typography>
        {/* <Stack
          spacing={2}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          maxWidth={"60%"}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Order ID: {attempt.order_id}
          </Typography>
          {attempt.type !== "normal" && attempt.parent_order_id && (
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              {"Ref order: " + attempt.parent_order_id}{" "}
            </Typography>
          )}
        </Stack> */}
      </Stack>

      {/* Vertical line container */}
      <Box
        sx={{
          ml: 0.5,
          pl: 2,
          borderLeft: "3px solid",
          //   borderColor: "secondary.dark",
          borderColor: "grey.300",
        }}
      >
        <Stack spacing={2}>
          {attempt.statuses.map((status, idx) => (
            <StatusHistoryItem
              key={idx}
              status={status}
              isLast={idx === attempt.statuses.length - 1}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

interface StatusItemProps {
  status: OrderHistory;
  isLast: boolean;
}

const StatusHistoryItem = ({ status, isLast }: StatusItemProps) => {
  return (
    <Box>
      <Stack spacing={2} direction={"row"} justifyContent={"space-between"}>
        <Typography variant="body2" fontWeight={600}>
          {new Date(status.changed_at).toLocaleString()}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {status.changed_by ?? "System"}
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ ml: 1 }}>
        {status.old_status ?? "New"} → {status.new_status}
      </Typography>

      {status.reason && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Reason: {status.reason}
        </Typography>
      )}

      {status.notes && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 1, display: "block" }}
        >
          Notes: {status.notes}
        </Typography>
      )}

      {!isLast && <Divider sx={{ mt: 1 }} />}
    </Box>
  );
};
