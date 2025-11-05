import React from "react";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import SwipeUpAltIcon from "@mui/icons-material/SwipeUpAlt";

export enum CostType {
  Stop = "stop",
  Article = "article",
  Slmd = "slmd",
}

const costRules = {
  [CostType.Stop]: {
    valid: (v: number, s: number) =>
      (v > 0 && v <= 15 && s > 10) || (v > 0 && v <= 140 && s <= 6),
    warning: (v: number, s: number) =>
      (v < 19 && s > 10) || (v < 140 && s <= 6),
  },
  [CostType.Article]: {
    valid: (v: number, s: number) =>
      (v > 0 && v <= 15 && s > 10) || (v > 0 && v <= 15 && s <= 6),
    warning: (v: number, s: number) => (v < 19 && s > 10) || (v < 50 && s <= 6),
  },
  [CostType.Slmd]: {
    valid: (v: number) => v > 0 && v <= 5,
    warning: (v: number) => v <= 8,
  },
} as const;

const CostEvaluator = ({
  value,
  stops,
  costType,
}: {
  value: number;
  stops: number;
  costType: CostType;
}) => {
  //   const stops = tour?.orderIds.split(",").length ?? 0;

  const getIcon = (color: "success" | "warning" | "error") => {
    switch (color) {
      case "success":
        return <FileDownloadDoneIcon fontSize="medium" color="success" />;
      case "warning":
        return <SwipeUpAltIcon fontSize="medium" color="warning" />;
      case "error":
        return <SwipeUpAltIcon fontSize="medium" color="error" />;
    }
  };

  const rule = costRules[costType];
  if (!rule) return null;

  const valid = rule.valid(value, stops);
  const warning = rule.warning(value, stops);

  if (valid) return getIcon("success");
  if (warning) return getIcon("warning");
  return getIcon("error");
};

export default CostEvaluator;
