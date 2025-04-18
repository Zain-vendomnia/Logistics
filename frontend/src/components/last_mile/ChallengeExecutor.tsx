import React, { useState } from "react";
import { ChallengeActionSteps, challenges } from "./challenges";
import ChallengeRenderer from "./ChallengeRenderer";

interface Props {
  scenarioKey: keyof typeof challenges;
  // challengeState: { }
}

export const ChallengeExecutor = ({ scenarioKey }: Props) => {
  const scenarioCase = challenges[scenarioKey];

  const [currentIndex, setCurrectIndex] = useState(0);

  const handleNext = () => setCurrectIndex((prev) => prev + 1);

  return (
    <>
      {scenarioCase.map((step, i) => (
        <ChallengeRenderer
          key={"step" + i}
          label={step}
          onComplete={handleNext}
        />
      ))}
    </>
  );
};
