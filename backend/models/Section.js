import mongoose from "mongoose";
const colors = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // yellow/orange
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6366F1", // indigo
  "#22D3EE", // cyan
  "#EAB308", // amber
  "#F43F5E", // rose
  "#4ADE80", // lime
  "#A78BFA", // violet
  "#FCD34D", // light yellow
  "#60A5FA", // sky blue
  "#F87171", // light red
  "#34D399", // light green
  "#C084FC", // light purple
  "#FB923C", // peachy orange
];

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: function () {
        // pick a random color from the array
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Section = mongoose.model("Section", sectionSchema);
export default Section;
