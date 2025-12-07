import React from "react";
import { Check, Minus, X } from "lucide-react";
import "../Common/css/eliminationActions.css";
import { useSound } from "../../hooks/useSound";

const EliminationActions = ({ onAction }) => {
  const { playSound } = useSound();

  const handleKnow = () => {
    onAction("know");
    playSound("correct");
  };

  const handleKinda = () => {
    onAction("kinda");
    playSound("ding");
  };

  return (
    <div className="elimination-actions-3">
      <button
        className="elim-btn yellow-btn"
        onClick={handleKinda}
        title="Kinda know - partial elimination"
      >
        <Minus size={18} />
        <span>Kinda</span>
      </button>

      <button
        className="elim-btn green-btn"
        onClick={handleKnow}
        title="I know it perfectly - eliminate"
      >
        <Check size={18} />
        <span>I Know It</span>
      </button>
    </div>
  );
};

export default EliminationActions;
