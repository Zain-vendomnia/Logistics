import { useState } from "react";
import adminApiService from "../../services/adminApiService";
import { getCurrentUser } from "../../services/auth.service";
import {
  Button,
  ButtonGroup,
  CircularProgress,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";

interface Props {
  orderId: number;
  currentStatus: string;
  onStatusUpdated?: (newStatus: string) => void;
}

const OrderStatusButton = ({
  orderId,
  currentStatus,
  onStatusUpdated,
}: Props) => {
  const statuses = ["inTransit", "delivered", "cancelled", "rescheduled"];

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (status: string) => {
    setSelectedStatus(status);
    handleClose();
  };

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) return;

    setLoading(true);
    try {
      const res = await adminApiService.updateOrderStatus({
        order_id: orderId,
        newStatus: selectedStatus,
        updated_by: getCurrentUser().email,
      });

      if (res?.data.status === "success") {
        onStatusUpdated?.(selectedStatus);
      } else {
        console.error(res?.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ButtonGroup variant="contained" size="small">
      <Button
        onClick={handleUpdate}
        disabled={loading || selectedStatus === currentStatus}
      >
        {loading ? <CircularProgress size={18} /> : selectedStatus}
      </Button>
      <Button aria-haspopup="true" onClick={handleToggle}>
        <KeyboardArrowDown />
      </Button>
      <Popper open={open} anchorEl={anchorEl} placement="bottom-end">
        <ClickAwayListener onClickAway={handleClose}>
          <Paper>
            <MenuList>
              {statuses.map((status) => (
                <MenuItem
                  key={status}
                  selected={status === selectedStatus}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(status);
                  }}
                >
                  {status}
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </ButtonGroup>
  );
};

export default OrderStatusButton;
