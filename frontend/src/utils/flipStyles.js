export const flipEffects = [
  {
    name: "horizontal",
    direction: "horizontal",
    cssClass: "",
  },
  {
    name: "vertical",
    direction: "vertical",
    cssClass: "",
  },
  {
    name: "diagonal-right",
    direction: "horizontal",
    cssClass: "diagonal-right-flip",
  },
  {
    name: "diagonal-left",
    direction: "vertical",
    cssClass: "diagonal-left-flip",
  },
  {
    name: "rotate-3d",
    direction: "horizontal",
    cssClass: "rotate-3d-flip",
  },
];

// Get random flip effect
export const getRandomFlipEffect = () => {
  return flipEffects[Math.floor(Math.random() * flipEffects.length)];
};

// CSS classes to add to your global CSS
export const flipEffectsCSS = `
  /* Diagonal Right Flip */
  .diagonal-right-flip .react-card-flip {
    perspective: 1000px;
  }
  
  .diagonal-right-flip .react-card-flipper {
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  
  .diagonal-right-flip .react-card-flip.react-card-flipped .react-card-flipper {
    transform: rotateY(180deg) rotateX(15deg);
  }
  
  /* Diagonal Left Flip */
  .diagonal-left-flip .react-card-flip {
    perspective: 1000px;
  }
  
  .diagonal-left-flip .react-card-flipper {
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  
  .diagonal-left-flip .react-card-flip.react-card-flipped .react-card-flipper {
    transform: rotateX(180deg) rotateY(15deg);
  }
  
  /* 3D Rotate Flip */
  .rotate-3d-flip .react-card-flip {
    perspective: 1200px;
  }
  
  .rotate-3d-flip .react-card-flipper {
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }
  
  .rotate-3d-flip .react-card-flip.react-card-flipped .react-card-flipper {
    transform: rotate3d(1, 0.5, 0.2, 180deg);
  }
  
  /* Ensure front/back are properly positioned for 3D */
  .diagonal-right-flip .react-card-front,
  .diagonal-right-flip .react-card-back,
  .diagonal-left-flip .react-card-front,
  .diagonal-left-flip .react-card-back,
  .rotate-3d-flip .react-card-front,
  .rotate-3d-flip .react-card-back {
    backface-visibility: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .diagonal-right-flip .react-card-back,
  .diagonal-left-flip .react-card-back,
  .rotate-3d-flip .react-card-back {
    transform: rotateY(180deg);
  }
`;
