import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarIcon from "@mui/icons-material/Star";

import { motion } from "framer-motion";

const ratingScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
type Rating = (typeof ratingScale)[number];

interface Props {
  rating?: Rating;
  onChange?: (newRating: Rating) => void;
  onComplete?: () => void;
}

const iconStyle = {
  fontSize: "5.5rem",
  color: "primary.dark",
};

const StarRating = ({
  rating: initialRating = 0,
  onChange,
  onComplete,
}: Props) => {
  const [selectedRating, setSelectedRating] = useState<Rating>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<Rating | null>(null);

  const current = hoveredRating ?? selectedRating;

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const x = e.nativeEvent.offsetX;
    const width = e.currentTarget.clientWidth;
    const isLeft = x < width / 2;

    const hoverValue = (index * 2 + (isLeft ? 1 : 2)) as Rating;
    setHoveredRating(hoverValue);
  };

  const handleClick = (value: Rating) => {
    setSelectedRating(value);
    onChange?.(value);
  };

  const crescentFontSizeMap: Record<number, string> = {
    0: "3.5rem",
    1: "3.7rem",
    2: "4.1rem",
    3: "3.7rem",
    4: "3.5rem",
  };

  const renderStar = (index: number) => {
    const valueLeft = (index * 2 + 1) as Rating;
    const valueRight = (index * 2 + 2) as Rating;
    let IconComponent: typeof StarBorderIcon = StarBorderIcon;
    if (current >= valueRight) IconComponent = StarIcon;
    else if (current === valueLeft) IconComponent = StarHalfIcon;
    return (
      <motion.span
        key={index}
        data-index={index}
        whileTap={{ scale: 1 }}
        whileHover={{ scale: 1.6 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredRating(null)}
        onClick={() => handleClick(current)}
        style={{ cursor: "pointer" }}
      >
        <IconComponent
          sx={{
            ...iconStyle,
            fontSize: crescentFontSizeMap[index],
          }}
        />
      </motion.span>
    );
  };

  const handleSubmit = () => {
    console.log("submit start button");
    onComplete?.();
  };
  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={"bold"} align={"center"}>
        Rating
      </Typography>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width={"100%"}
        height={"100%"}
      >
        {Array.from({ length: 5 }, (_, i) => renderStar(i))}
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedRating}
          sx={{ width: "250px", maxWidth: "350ps" }}
        >
          Submit Rating
        </Button>
      </Box>

      <Typography variant="body2" align="center" color="text.secondary">
        {" "}
      </Typography>
    </Stack>
  );
};

export default StarRating;
