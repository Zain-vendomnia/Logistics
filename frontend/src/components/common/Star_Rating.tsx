import React, { useEffect, useState } from "react";

import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarIcon from "@mui/icons-material/Star";
import { Box } from "@mui/material";

type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface Props {
  rating: Rating;
}
const StarRating = ({ rating }: Props) => {
  const [stars, setStars] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 !== 0;
    const emptyStarts = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starElements: JSX.Element[] = [];

    for (let i = 0; i < fullStars; i++) {
      starElements.push(<StarIcon key={`full-${i}`} color={"primary"} />);
    }

    if (hasHalfStar) {
      starElements.push(<StarHalfIcon key={"half"} color={"primary"} />);
    }

    for (let i = 0; i < emptyStarts; i++) {
      starElements.push(
        <StarBorderIcon key={`empty-${i}`} color={"primary"} />
      );
    }

    setStars(starElements);
  }, [rating]);

  return <Box display={"flex"}>{stars}</Box>;
};

export default StarRating;
