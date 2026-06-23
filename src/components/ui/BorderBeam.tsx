"use client";

import { motion } from "framer-motion";

export default function BorderBeam({
  size = 200,
  duration = 15,
  colorFrom = "#c9a227",
  colorTo = "#34d399",
  delay = 0,
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      <motion.div
        animate={{
          transform: [
            "translateX(-100%) translateY(-100%)",
            "translateX(100%) translateY(-100%)",
            "translateX(100%) translateY(100%)",
            "translateX(-100%) translateY(100%)",
            "translateX(-100%) translateY(-100%)",
          ],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
        style={{
          position: "absolute",
          width: size,
          height: size,
          background: `conic-gradient(from 90deg at 50% 50%, transparent, ${colorFrom}, ${colorTo}, transparent)`,
          filter: "blur(20px)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}
